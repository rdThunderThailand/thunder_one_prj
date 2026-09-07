// The merged editor's write sequence, lifted out of CompositionEditorPage.
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
import { bindingsFromCompositionZones, remapZoneBindings, toSetZonesPayload, withIdempotencyKeys, type ZoneBindingDraft } from "./zone-bindings";

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
  /** Ticket 28's recovery seams. Each hands a partial result back to the draft the moment it
   *  exists, so a save that dies partway leaves the editor holding what the failed attempt
   *  already earned — the `layouts` row id, the `compositions` row id, and each Zone's
   *  idempotency key and Playlist id. Without them a retry restarts from step 1 and mints
   *  duplicates (ADR 0063 §2) — and the second `compositions` insert fails outright, since an
   *  inline Layout may belong to only one Composition. */
  onLayoutCreated?: (layoutId: string) => void;
  onCompositionCreated?: (compositionId: string) => void;
  onBindingsChanged?: (bindings: ZoneBindingDraft[]) => void;
  /** Geometry as the RPC now holds it, with its own Zone ids. Handed over as soon as it is
   *  read so a later failure leaves the canvas showing real ids rather than the client-minted
   *  ones the bindings have already been remapped off. */
  onLayoutSaved?: (layout: LayoutListItem) => void;
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
  let refreshedLayout: LayoutListItem | null = null;

  // Before any write: every Zone that will need an inline Playlist gets its idempotency key,
  // handed straight back to the draft so a failed save leaves it there (ADR 0063 §2 3b).
  let bindings = withIdempotencyKeys(input.bindings);
  if (bindings !== input.bindings) input.onBindingsChanged?.(bindings);

  // Existing geometry, changed here: rewrite the layouts row. Zones the RPC has never seen
  // are sent without an id so it inserts them.
  if (layoutId && !blankZones && layout && (editedZones || layoutSettings)) {
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
    input.onLayoutSaved?.(refreshedLayout);
    bindings = remapZoneBindings(bindings, zones, refreshedLayout.zones);
    zoneIds = refreshedLayout.zones.flatMap((zone) => (zone.id ? [zone.id] : []));
  }

  // No geometry yet — a blank canvas or a copied preset. Created as a template so the row
  // has an id, then flipped to private `inline` geometry (ADR 0063 §2 steps 1–2).
  //
  // `editedZones` wins over `blankZones`: on this path the canvas edits (drag, Split, align,
  // duplicate) are made against the client-minted seed, so ignoring them here would discard
  // every geometry change made before the first save.
  if (blankZones) {
    const zones = editedZones ?? blankZones;
    if (!layoutId) {
      const created = await upsertLayout({
        name: input.name.trim() || "Untitled Layout",
        aspectRatio: layoutSettings?.aspectRatio ?? "16:9",
        referenceResolution: layoutSettings?.referenceResolution ?? null,
        background: layoutSettings?.background ?? "#000000",
        status: "active",
        zones: zones.map(({ name, x, y, width, height }) => ({ name, x, y, width, height })),
      });
      layoutId = created.layout_id;
      // Step 1's id, banked before step 2 can fail: the retry arrives holding it and resumes
      // at step 2 instead of leaving a second orphan `kind='template'` row behind.
      input.onLayoutCreated?.(layoutId);
    }
    // ponytail: a resume skips the write above, so geometry edited between the failed attempt
    // and the retry rides on the next save rather than this one — harmless while the Zone
    // count is unchanged, since the remap below is positional. Rewriting on resume needs the
    // server's Zone ids, which only exist after the fetch that follows.
    await setLayoutKind(layoutId, "inline");
    refreshedLayout = await fetchLayout(layoutId);
    input.onLayoutSaved?.(refreshedLayout);
    bindings = remapZoneBindings(bindings, zones, refreshedLayout.zones);
    input.onBindingsChanged?.(bindings);
    zoneIds = refreshedLayout.zones.flatMap((zone) => (zone.id ? [zone.id] : []));
  }

  if (!layoutId) throw new Error("Invalid input: layout is required");

  const upserted = await upsertComposition({
    compositionId: input.compositionId,
    name: input.name,
    layoutId,
    expectedRevision: input.revision,
  });
  // Banked before the Playlist loop can fail: the layout row already points here, so a retry
  // that re-inserts would hit "an inline Layout may belong to only one Composition".
  if (!input.compositionId) input.onCompositionCreated?.(upserted.composition_id);

  // ADR 0063 §2 3b. Every id is banked into the draft the moment it exists, never after the
  // loop: a failure on a later Zone must not cost the earlier ones their Playlist ids, or the
  // retry mints a second set of invisible `kind='inline'` rows. The `if (!playlistId)` guard
  // below is what makes that retry a no-op for the Zones that already succeeded, and the
  // idempotency key covers the one that did not — it was minted before the call, so re-sending
  // it returns the same row rather than another one.
  const zoneNames = refreshedLayout ?? layout;
  const resolved: ZoneBindingDraft[] = [];
  for (const binding of bindings) {
    if (!zoneIds.includes(binding.layoutZoneId)) continue;
    if (binding.source === "playlist" || binding.assetItems.length === 0) {
      resolved.push(binding);
      continue;
    }
    let playlistId = binding.playlistId;
    if (!playlistId) {
      const zoneName = zoneNames?.zones.find((zone) => zone.id === binding.layoutZoneId)?.name ?? "Zone";
      const created = await upsertPlaylist({
        name: `${input.name.trim() || "Composition"} · ${zoneName}`,
        kind: "inline",
        idempotencyKey: binding.idempotencyKey ?? crypto.randomUUID(),
      });
      playlistId = created.playlist_id;
    }
    resolved.push({ ...binding, playlistId });
    // Before set_items, not after: the Playlist exists from here on, so a failure filling it
    // must still leave the draft pointing at it.
    input.onBindingsChanged?.([...resolved, ...bindings.slice(resolved.length)]);
    await setPlaylistItems(
      playlistId,
      binding.assetItems.map((item, index) => ({
        media_asset_id: item.media_asset_id,
        position: index,
        ...(item.duration_seconds != null ? { duration_seconds: item.duration_seconds } : {}),
        transition: item.transition ?? "cut",
      })),
    );
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
