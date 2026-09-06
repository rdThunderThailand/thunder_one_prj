import { requestApi } from "@/lib/api/media-api";
import type { LayoutKind, LayoutListItem, LayoutStatus } from "../types";

// Reads live here rather than in src/lib/api/media-api.ts (the shared cross-feature
// surface, see fetchPlaylist/fetchPlaylists there): nothing outside this feature reads a
// Layout yet.
// ponytail: move fetchLayouts/fetchLayout to media-api.ts when Screen 3 makes the
// Publication wizard a second reader.

export async function fetchLayouts(kind: LayoutKind = "template"): Promise<LayoutListItem[]> {
  const data = await requestApi<{ layouts?: LayoutListItem[] } | LayoutListItem[]>(
    "GET",
    `/media/layouts?kind=${kind}`
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.layouts)) return data.layouts;
  return [];
}

export async function fetchLayout(id: string): Promise<LayoutListItem> {
  return requestApi<LayoutListItem>("GET", `/media/layouts/${id}`);
}

export type ZonePayload = {
  /** Round-tripped from a loaded Zone so an edit that only renames or resizes keeps the
   *  same `layout_zones.id` — absent for a Zone the editor has not saved yet. */
  id?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UpsertLayoutInput = {
  layoutId?: string | null;
  name: string;
  aspectRatio: string;
  referenceResolution?: string | null;
  background: string;
  status?: LayoutStatus;
  zones: ZonePayload[];
};

export async function upsertLayout(
  input: UpsertLayoutInput
): Promise<{ layout_id: string; zone_count: number }> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    aspect_ratio: input.aspectRatio,
    reference_resolution: input.referenceResolution ?? null,
    background: input.background,
    zones: input.zones,
  };
  if (input.status) body.status = input.status;

  if (input.layoutId) {
    return requestApi("PATCH", `/media/layouts/${input.layoutId}`, body);
  }
  return requestApi("POST", "/media/layouts", body);
}

export async function setLayoutStatus(
  id: string,
  status: LayoutStatus
): Promise<{ layout_id: string; status: LayoutStatus }> {
  return requestApi("PATCH", `/media/layouts/${id}`, { status });
}

export async function setLayoutKind(
  id: string,
  kind: LayoutKind,
): Promise<{ layout_id: string; kind: LayoutKind }> {
  return requestApi("PATCH", `/media/layouts/${id}/kind`, { kind });
}

/**
 * ADR 0052 §4: *Save as Template* names the row and flips it to `template`. Two calls,
 * because `media_layout_set_kind` renames in one direction only — it stamps `comp:<uuid>`
 * on the way to `inline` and deliberately leaves the name alone on the way back, so the
 * operator's name has to arrive through the upsert. That means resending the geometry:
 * `PATCH /media/layouts/:id` reads a body without `zones` as a status change, so there is
 * no name-only shape to send. Zone ids are round-tripped, which is what makes it an update
 * rather than a second set of Zones the Composition's bindings would no longer point at.
 *
 * Renaming *before* the flip is the deliberate order: a failure then leaves the row still
 * private and invisible, so a retry is clean. Flipping first and failing to rename leaves a
 * `comp:<uuid>` row sitting in the operator's Templates list — which is the bug this fixes.
 */
export async function promoteLayoutToTemplate(layoutId: string, name: string): Promise<void> {
  const layout = await fetchLayout(layoutId);
  await upsertLayout({
    layoutId,
    name,
    aspectRatio: layout.aspect_ratio,
    referenceResolution: layout.reference_resolution ?? null,
    background: layout.background,
    status: layout.status,
    zones: layout.zones.map((zone) => ({
      id: zone.id, name: zone.name, x: zone.x, y: zone.y, width: zone.width, height: zone.height,
    })),
  });
  await setLayoutKind(layoutId, "template");
}

/**
 * There is no duplicate endpoint for Layouts — the copy is composed from a read plus an
 * upsert, following `duplicatePlaylist`'s precedent
 * (src/features/media-workspace/playlists/services/playlists-api.ts).
 */
export async function duplicateLayout(sourceId: string, name: string): Promise<{ layoutId: string }> {
  const source = await fetchLayout(sourceId);
  const { layout_id } = await upsertLayout({
    name,
    aspectRatio: source.aspect_ratio,
    referenceResolution: source.reference_resolution ?? null,
    background: source.background,
    status: "active",
    // A duplicate is a new Layout with fresh Zone ids, not a copy of the source's — omitting
    // `id` here is what makes the upsert insert instead of update.
    zones: source.zones.map((z) => ({
      name: z.name,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
    })),
  });
  return { layoutId: layout_id };
}
