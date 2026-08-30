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

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const data = await requestApi<MediaAsset[]>("GET", "/media/videos");
  return Array.isArray(data) ? data : [];
}

export async function fetchMediaAsset(id: string): Promise<MediaAsset> {
  return requestApi<MediaAsset>("GET", `/media/videos/${id}`);
}

export async function fetchMediaAssetPage(params: {
  search?: string;
  kind?: "image" | "video";
  folderId?: string;
  page?: number;
  trash?: boolean;
}): Promise<MediaAssetPage> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), page_size: "24" });
  if (params.search) query.set("search", params.search);
  if (params.kind) query.set("kind", params.kind);
  if (params.folderId) query.set("folder_id", params.folderId);
  if (params.trash) query.set("trash", "true");
  return requestApi<MediaAssetPage>("GET", `/media/videos?${query}`);
}

export async function fetchContentFolders(scope: "asset" | "playlist" | "composition"): Promise<ContentFolder[]> {
  return requestApi<ContentFolder[]>("GET", `/media/folders?scope=${scope}`);
}

export async function createContentFolder(input: { name: string; parent_id?: string | null }): Promise<ContentFolder> {
  return requestApi<ContentFolder>("POST", "/media/folders", { scope: "asset", ...input });
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

// Playlist reads — shared by publications and playlists (docs/adr/0020). Writes
// (`upsertPlaylist`, `setPlaylistItems`) stay in features/playlists/services.

/** `includeDrafts` defaults to `false` so a caller that forgets to opt in never
 *  leaks drafts into the publication content picker — an unfinished playlist
 *  must never be selectable for scheduling. */
export async function fetchPlaylists(includeDrafts = false): Promise<PlaylistListItem[]> {
  const path = includeDrafts ? "/media/playlists?include_drafts=true" : "/media/playlists";
  const data = await requestApi<{ playlists?: PlaylistListItem[] } | PlaylistListItem[]>(
    "GET",
    path
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.playlists)) {
    return data.playlists;
  }
  return [];
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return requestApi<PlaylistDetail>("GET", `/media/playlists/${id}`);
}
