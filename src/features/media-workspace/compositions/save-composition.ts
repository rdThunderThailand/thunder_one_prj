// The merged editor's write sequence, lifted out of CompositionEditorPage so ticket 28 can
// rework it (first-save recovery) without colliding with tickets 26 and 27.
//
// ADR 0063 §2 spells the order out. Geometry must exist before the Composition that points
// at it, and every inline Playlist must exist before the bindings that name it:
//
//   blank / preset : layout_upsert → layout_set_kind('inline') → composition_upsert
//                    → [playlist_upsert + set_items] per asset-bound Zone → set_zones
//   operator Template : composition_upsert → [same loop] → set_zones
//
// then, when the panel changed them, the two filing writes (§4). Those are last because
// they need the Composition to exist, and safe there because both replace wholesale — a
// retry sets the same folder and the same tag set, so neither adds a recovery hole.

import { fetchLayout, setLayoutKind, upsertLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import { setPlaylistItems, upsertPlaylist } from "@/features/media-workspace/playlists/services/playlists-api";
import { fetchComposition, forkCompositionLayout, moveComposition, setCompositionTags, setCompositionZones, upsertComposition } from "./services/compositions-api";
import { bindingsFromCompositionZones, remapZoneBindings, toSetZonesPayload, type ZoneBindingDraft } from "./zone-bindings";

/** Resolution, aspect ratio and background live on the `layouts` row, not the Composition —
 *  which is why editing them can interrupt with ADR 0052 §3's shared-Template warning. */
export type LayoutSettingsDraft = {
  aspectRatio: string;
  referenceResolution: string | null;
  background: string;
};

export type PersistInput = {
  compositionId: string | null;
  name: string;
  revision: number | null;
  layoutId: string | null;
  /** The layout the editor is showing, already merged with any in-progress Zone edits. */
  layout: Pick<LayoutListItem, "name" | "aspect_ratio" | "reference_resolution" | "background" | "status" | "zones"> | null;
  /** Non-null only when the Properties panel changed resolution or background. */
  layoutSettings: LayoutSettingsDraft | null;
  /** Zone ids already persisted, so a new Zone is inserted rather than updated. */
  savedZoneIds: Set<string>;
  editedZones: LayoutZone[] | null;
  blankZones: LayoutZone[] | null;
  layoutZoneIds: string[];
  bindings: ZoneBindingDraft[];
  /** `undefined` leaves the folder alone; `null` moves the Composition to Uncategorized. */
  folderId?: string | null;
  /** `undefined` leaves tags alone. An empty array clears them. */
  tags?: string[];
};

export type PersistResult = {
  compositionId: string;
  revision: number;
  layoutId: string;
  /** Re-read whenever geometry was written, because the RPC mints Zone ids. */
  refreshedLayout: LayoutListItem | null;
  /** The binding set with every inline Playlist id resolved. */
  bindings: ZoneBindingDraft[];
};

export async function persistComposition(input: PersistInput): Promise<PersistResult> {
  const { layout, layoutSettings, editedZones, blankZones } = input;
  let layoutId = input.layoutId;
  let zoneIds = input.layoutZoneIds;
  let bindings = input.bindings;
  let refreshedLayout: LayoutListItem | null = null;

  // Existing geometry, changed here: rewrite the layouts row. Zones the RPC has never seen
  // are sent without an id so it inserts them.
  if (layoutId && layout && (editedZones || layoutSettings)) {
    const zones = editedZones ?? layout.zones;
    await upsertLayout({
      layoutId,
      name: layout.name,
      aspectRatio: layoutSettings?.aspectRatio ?? layout.aspect_ratio,
      referenceResolution: layoutSettings ? layoutSettings.referenceResolution : (layout.reference_resolution ?? null),
      background: layoutSettings?.background ?? layout.background,
      status: layout.status,
      zones: zones.map((zone) => ({
        ...(zone.id && input.savedZoneIds.has(zone.id) ? { id: zone.id } : {}),
        name: zone.name,
        x: zone.x ?? 0,
        y: zone.y ?? 0,
        width: zone.width ?? 0,
        height: zone.height ?? 0,
      })),
    });
    refreshedLayout = await fetchLayout(layoutId);
    bindings = remapZoneBindings(bindings, zones, refreshedLayout.zones);
    zoneIds = refreshedLayout.zones.flatMap((zone) => (zone.id ? [zone.id] : []));
  }

  // No geometry yet — a blank canvas or a copied preset. Created as a template so the row
  // has an id, then flipped to private `inline` geometry (ADR 0063 §2 steps 1–2).
  if (!layoutId && blankZones) {
    const created = await upsertLayout({
      name: input.name.trim() || "Untitled Layout",
      aspectRatio: layoutSettings?.aspectRatio ?? "16:9",
      referenceResolution: layoutSettings?.referenceResolution ?? null,
      background: layoutSettings?.background ?? "#000000",
      status: "active",
      zones: blankZones.map(({ name, x, y, width, height }) => ({ name, x, y, width, height })),
    });
    layoutId = created.layout_id;
    await setLayoutKind(layoutId, "inline");
    refreshedLayout = await fetchLayout(layoutId);
    bindings = remapZoneBindings(bindings, blankZones, refreshedLayout.zones);
    zoneIds = refreshedLayout.zones.flatMap((zone) => (zone.id ? [zone.id] : []));
  }

  if (!layoutId) throw new Error("Invalid input: layout is required");

  const upserted = await upsertComposition({
    compositionId: input.compositionId,
    name: input.name,
    layoutId,
    expectedRevision: input.revision,
  });

  // ADR 0063 §2 3b. KNOWN GAP, ticket 28: the ids earned here only reach the caller if the
  // whole loop completes, so a failure partway leaves orphan `kind='inline'` Playlists and
  // the next attempt makes more. Fixing that is ticket 28's job — it needs the id and the
  // idempotency key to become draft state, written the moment they exist.
  const resolved: ZoneBindingDraft[] = [];
  for (const binding of bindings) {
    if (binding.source === "playlist" || binding.assetItems.length === 0) {
      resolved.push(binding);
      continue;
    }
    let playlistId = binding.playlistId;
    if (!playlistId) {
      const zoneName = layout?.zones.find((zone) => zone.id === binding.layoutZoneId)?.name ?? "Zone";
      const created = await upsertPlaylist({
        name: `${input.name.trim() || "Composition"} · ${zoneName}`,
        kind: "inline",
        idempotencyKey: crypto.randomUUID(),
      });
      playlistId = created.playlist_id;
    }
    await setPlaylistItems(
      playlistId,
      binding.assetItems.map((item, index) => ({
        media_asset_id: item.media_asset_id,
        position: index,
        ...(item.duration_seconds != null ? { duration_seconds: item.duration_seconds } : {}),
        transition: item.transition ?? "cut",
      })),
    );
    resolved.push({ ...binding, playlistId });
  }

  const zonesResult = await setCompositionZones(upserted.composition_id, toSetZonesPayload(zoneIds, resolved), upserted.revision);

  // Filing, last: both need the Composition to exist and both replace wholesale.
  if (input.folderId !== undefined) await moveComposition(upserted.composition_id, input.folderId);
  if (input.tags !== undefined) await setCompositionTags(upserted.composition_id, input.tags);

  return {
    compositionId: upserted.composition_id,
    revision: zonesResult.revision,
    layoutId,
    refreshedLayout,
    bindings: resolved,
  };
}

/** ADR 0052 §3's escape hatch: give this Composition private geometry so an edit stops
 *  travelling to the other Layouts on the Template. Returns everything the editor has to
 *  swap in — the Zone ids are new, so the bindings come back re-read rather than remapped. */
export async function forkLayoutForComposition(
  compositionId: string,
  revision: number | null,
): Promise<{ layout: LayoutListItem; bindings: ZoneBindingDraft[]; revision: number }> {
  const forked = await forkCompositionLayout(compositionId, revision);
  const [detail, layout] = await Promise.all([fetchComposition(compositionId), fetchLayout(forked.layout_id)]);
  return { layout, bindings: bindingsFromCompositionZones(detail.zones), revision: forked.revision };
}
