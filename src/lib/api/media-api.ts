import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { Campaign, ContentFolder, MediaAsset, MediaAssetPage, PlaylistDetail, PlaylistListItem, Tag } from "@/types/domain";

/**
 * Shared transport for every `/api/proxy/media/*` call. Feature services build
 * their typed functions on top of this instead of talking to axios directly.
 */
export async function requestApi<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  data?: unknown
): Promise<T> {
  const res = await apiClient.request({
    url: `/api/proxy${path}`,
    method,
    data,
    validateStatus: () => true,
  });

  const resData = res.data;

  if (
    resData &&
    typeof resData === "object" &&
    "error" in (resData as Record<string, unknown>)
  ) {
    const errorMsg =
      (resData as { error: string }).error || "API request failed";
    // The proxy can return an error body with a 2xx, so carry the status through
    // rather than assuming the failure kind from the message alone.
    throw new ApiError(errorMsg, res.status);
  }

  if (res.status < 200 || res.status >= 300) {
    throw new ApiError(`HTTP Error ${res.status}`, res.status);
  }

  if (resData && typeof resData === "object") {
    if (
      "success" in (resData as Record<string, unknown>) &&
      "data" in (resData as Record<string, unknown>)
    ) {
      return (resData as { data: T }).data;
    }
    return resData as T;
  }

  return resData as T;
}

export type PreviewUrls = {
  urls: Record<string, string>;
  thumbnailUrls: Record<string, string>;
};

/** Batch-signs 1h preview URLs (and, for videos with a captured poster, thumbnail URLs). */
export async function fetchPreviewUrls(ids: string[]): Promise<PreviewUrls> {
  if (ids.length === 0) return { urls: {}, thumbnailUrls: {} };
  const data = await requestApi<{
    urls?: Record<string, string>;
    thumbnail_urls?: Record<string, string>;
  }>("POST", "/media/videos/preview-urls", { ids });
  return { urls: data.urls ?? {}, thumbnailUrls: data.thumbnail_urls ?? {} };
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const data = await requestApi<{ campaigns?: Campaign[] } | Campaign[]>(
    "GET",
    "/media/campaigns"
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.campaigns)) {
    return data.campaigns;
  }
  return [];
}

export async function fetchTags(): Promise<Tag[]> {
  const data = await requestApi<{ tags?: Tag[] } | Tag[]>("GET", "/media/tags");
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.tags)) {
    return data.tags;
  }
  return [];
}

/** The list endpoint is paginated; callers that need the whole library page through it. */
const ASSET_PAGE_SIZE = 200;

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const assets: MediaAsset[] = [];
  for (let page = 1; ; page += 1) {
    const data = await requestApi<MediaAssetPage>("GET", `/media/videos?page=${page}&page_size=${ASSET_PAGE_SIZE}`);
    const items = Array.isArray(data?.items) ? data.items : [];
    assets.push(...items);
    if (items.length < ASSET_PAGE_SIZE) return assets;
  }
}

export async function fetchMediaAsset(id: string): Promise<MediaAsset> {
  return requestApi<MediaAsset>("GET", `/media/videos/${id}`);
}

export async function fetchMediaAssetPage(params: {
  search?: string;
  kind?: "image" | "video";
  folderId?: string;
  page?: number;
  pageSize?: number;
  trash?: boolean;
}): Promise<MediaAssetPage> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 24) });
  if (params.search) query.set("search", params.search);
  if (params.kind) query.set("kind", params.kind);
  if (params.folderId) query.set("folder_id", params.folderId);
  if (params.trash) query.set("trash", "true");
  return requestApi<MediaAssetPage>("GET", `/media/videos?${query}`);
}

export async function fetchContentFolders(scope: "asset" | "playlist" | "composition"): Promise<ContentFolder[]> {
  return requestApi<ContentFolder[]>("GET", `/media/folders?scope=${scope}`);
}

export async function createContentFolder(scope: "asset" | "playlist" | "composition", input: { name: string; parent_id?: string | null }): Promise<ContentFolder> {
  return requestApi<ContentFolder>("POST", "/media/folders", { scope, ...input });
}

export async function renameContentFolder(id: string, name: string): Promise<void> {
  await requestApi("PATCH", `/media/folders/${id}`, { name });
}

export async function moveContentFolder(id: string, parentId: string | null): Promise<void> {
  await requestApi("PATCH", `/media/folders/${id}/move`, { parent_id: parentId });
}

export async function deleteContentFolder(id: string): Promise<void> {
  await requestApi("DELETE", `/media/folders/${id}`);
}

export async function trashMediaAsset(id: string): Promise<void> {
  await requestApi("DELETE", `/media/videos/${id}`);
}

export async function restoreMediaAsset(id: string): Promise<void> {
  await requestApi("POST", `/media/videos/${id}/restore`);
}

export async function permanentlyDeleteMediaAsset(id: string): Promise<void> {
  await requestApi("DELETE", `/media/videos/${id}/permanent`);
}

export async function moveMediaAsset(id: string, folderId: string | null): Promise<void> {
  await requestApi("PATCH", `/media/videos/${id}`, { folder_id: folderId });
}

/** Move a playlist into a folder, or to Uncategorized (`null`) — Thunder_Core #38 / BE-3.
 *  Separate sub-route so the editor's `PATCH /media/playlists/{id}` save path is untouched. */
export async function movePlaylist(id: string, folderId: string | null): Promise<void> {
  await requestApi("PATCH", `/media/playlists/${id}/move`, { folder_id: folderId });
}

/** Replaces a playlist's tags wholesale against the tenant's shared vocabulary —
 *  Thunder_Core #41 / ADR 0060 §8a. Names, not ids: the backend creates what does not
 *  exist yet and reuses the existing spelling for what does. Returns the stored set so
 *  the caller renders the canonical casing rather than what was typed. */
export async function setPlaylistTags(id: string, tags: string[]): Promise<Tag[]> {
  const data = await requestApi<{ tags?: Tag[] }>("PUT", `/media/playlists/${id}/tags`, { tags });
  return data.tags ?? [];
}

// Playlist reads — shared by publications and playlists (docs/adr/0020). Writes
// (`upsertPlaylist`, `setPlaylistItems`) stay in features/playlists/services.

/** `includeDrafts` defaults to `false` so a caller that forgets to opt in never
 *  leaks drafts into the publication content picker — an unfinished playlist
 *  must never be selectable for scheduling. */
export async function fetchPlaylists(
  includeDrafts = false,
  trash = false
): Promise<PlaylistListItem[]> {
  const query = new URLSearchParams();
  if (includeDrafts) query.set("include_drafts", "true");
  if (trash) query.set("trash", "true");
  const suffix = query.toString();
  const data = await requestApi<{ playlists?: PlaylistListItem[] } | PlaylistListItem[]>(
    "GET",
    suffix ? `/media/playlists?${suffix}` : "/media/playlists"
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.playlists)) {
    return data.playlists;
  }
  return [];
}

/** Restore a soft-deleted playlist — to its former folder, or Uncategorized if that
 *  folder is gone (Thunder_Core #40). */
export async function restorePlaylist(id: string): Promise<void> {
  await requestApi("POST", `/media/playlists/${id}/restore`);
}

/** Permanently delete a trashed playlist. Resolves to `{ deleted: false, reason: "published" }`
 *  — not an error — when the playlist has ever been published (`publications.playlist_id`
 *  is `ON DELETE RESTRICT`); the caller explains that instead of retrying. */
export async function permanentlyDeletePlaylist(
  id: string
): Promise<{ deleted: boolean; reason?: string }> {
  return requestApi("DELETE", `/media/playlists/${id}/permanent`);
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return requestApi<PlaylistDetail>("GET", `/media/playlists/${id}`);
}
