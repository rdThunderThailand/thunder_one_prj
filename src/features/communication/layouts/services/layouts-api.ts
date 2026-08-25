import { requestApi } from "@/lib/api/media-api";
import type { LayoutListItem, LayoutStatus, LayoutZone } from "../types";

// Reads live here rather than in src/lib/api/media-api.ts (the shared cross-feature
// surface, see fetchPlaylist/fetchPlaylists there): nothing outside this feature reads a
// Layout yet.
// ponytail: move fetchLayouts/fetchLayout to media-api.ts when Screen 3 makes the
// Publication wizard a second reader.

export async function fetchLayouts(): Promise<LayoutListItem[]> {
  const data = await requestApi<{ layouts?: LayoutListItem[] } | LayoutListItem[]>(
    "GET",
    "/media/layouts"
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.layouts)) return data.layouts;
  return [];
}

export async function fetchLayout(id: string): Promise<LayoutListItem> {
  return requestApi<LayoutListItem>("GET", `/media/layouts/${id}`);
}

export type ZonePayload = {
  name: string;
  role: LayoutZone["role"];
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UpsertLayoutInput = {
  layoutId?: string | null;
  name: string;
  aspectRatio: string;
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

/**
 * There is no duplicate endpoint for Layouts — the copy is composed from a read plus an
 * upsert, following `duplicatePlaylist`'s precedent
 * (src/features/communication/playlists/services/playlists-api.ts).
 */
export async function duplicateLayout(sourceId: string, name: string): Promise<{ layoutId: string }> {
  const source = await fetchLayout(sourceId);
  const { layout_id } = await upsertLayout({
    name,
    aspectRatio: source.aspect_ratio,
    background: source.background,
    status: "active",
    zones: source.zones.map((z) => ({
      name: z.name,
      role: z.role,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
    })),
  });
  return { layoutId: layout_id };
}
