import { apiClient } from "@/lib/api/client";
import type {
  BasicInfoForm,
  Campaign,
  ContentItem,
  MediaAsset,
  PlaylistDetail,
  Priority,
  Publication,
  PublicationDetail,
  PublicationListItem,
  PublicationSchedule,
  PublicationTarget,
  Recurrence,
  ScheduleConflict,
  SchedulePayload,
  Screen,
  Tag,
} from "../types";

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
    throw new Error(errorMsg);
  }

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP Error ${res.status}`);
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

export async function fetchCampaigns(): Promise<Campaign[]> {
  const data = await requestApi<{ campaigns?: Campaign[] } | Campaign[]>(
    "GET",
    "/media/campaigns"
  );
  if (Array.isArray(data)) {
    return data;
  }
  if (
    data &&
    typeof data === "object" &&
    "campaigns" in data &&
    Array.isArray(data.campaigns)
  ) {
    return data.campaigns;
  }
  return [];
}

export async function fetchTags(): Promise<Tag[]> {
  const data = await requestApi<{ tags?: Tag[] } | Tag[]>("GET", "/media/tags");
  if (Array.isArray(data)) {
    return data;
  }
  if (
    data &&
    typeof data === "object" &&
    "tags" in data &&
    Array.isArray(data.tags)
  ) {
    return data.tags;
  }
  return [];
}

export async function fetchScreens(): Promise<Screen[]> {
  const data = await requestApi<{ screens?: Screen[] } | Screen[]>(
    "GET",
    "/media/screens"
  );
  if (Array.isArray(data)) {
    return data;
  }
  if (
    data &&
    typeof data === "object" &&
    "screens" in data &&
    Array.isArray(data.screens)
  ) {
    return data.screens;
  }
  return [];
}

function cleanBasicInfoBody(
  form: BasicInfoForm,
  publicationId: string | null
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: form.name.trim(),
  };

  if (publicationId) {
    body.publication_id = publicationId;
  }
  if (form.description?.trim()) {
    body.description = form.description.trim();
  }
  if (form.campaign_id?.trim()) {
    body.campaign_id = form.campaign_id.trim();
  }
  if (form.publication_type) {
    body.publication_type = form.publication_type;
  }
  if (form.priority) {
    body.priority = form.priority;
  }
  if (form.language?.trim()) {
    body.language = form.language.trim();
  }
  // Always sent, even when empty: the backend treats a missing `tags` as
  // "leave untouched", so an empty array is the only way to clear them.
  body.tags = form.tags ?? [];

  return body;
}

export async function saveBasicInfo(
  form: BasicInfoForm,
  publicationId: string | null,
  targets?: PublicationTarget[]
): Promise<Publication> {
  const body = cleanBasicInfoBody(form, publicationId);
  // PATCH replaces every field it receives, so the caller must always post the
  // whole form. `targets` is the exception: omitting the key leaves the saved
  // targets untouched, which is what steps 1 and 2 want.
  if (targets) {
    body.targets = targets;
  }
  const method = publicationId ? "PATCH" : "POST";
  return requestApi<Publication>(method, "/media/publications", body);
}

export async function fetchPublications(
  status: "draft" | "active"
): Promise<PublicationListItem[]> {
  const data = await requestApi<
    { publications?: PublicationListItem[] } | PublicationListItem[]
  >("GET", `/media/publications?status=${status}`);
  if (Array.isArray(data)) {
    return data;
  }
  if (
    data &&
    typeof data === "object" &&
    "publications" in data &&
    Array.isArray(data.publications)
  ) {
    return data.publications;
  }
  return [];
}

export async function fetchPublication(id: string): Promise<PublicationDetail> {
  return requestApi<PublicationDetail>("GET", `/media/publications/${id}`);
}

export async function deletePublication(id: string): Promise<void> {
  await requestApi<unknown>("DELETE", `/media/publications/${id}`);
}

/** Stops an active publication. Devices drop it on their next poll. */
export async function cancelPublication(id: string): Promise<void> {
  await requestApi<unknown>("POST", `/media/publications/${id}/cancel`);
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const data = await requestApi<MediaAsset[]>("GET", "/media/videos");
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

export async function savePublicationContent(
  id: string,
  items: ContentItem[]
): Promise<{ playlist_id: string; item_count: number }> {
  return requestApi<{ playlist_id: string; item_count: number }>(
    "PUT",
    `/media/publications/${id}/content`,
    { items }
  );
}

export async function savePublicationSchedule(
  id: string,
  payload: SchedulePayload
): Promise<PublicationSchedule> {
  return requestApi<PublicationSchedule>(
    "PUT",
    `/media/publications/${id}/schedule`,
    payload
  );
}

/**
 * Step 5. Activates a draft: builds the publish jobs that real screens poll.
 * The RPC refuses a publication with no playlist or no targets.
 */
export async function activatePublication(id: string): Promise<{ job_id?: string }> {
  return requestApi<{ job_id?: string }>(
    "POST",
    `/media/publications/${id}/activate`
  );
}

export async function checkScheduleConflicts(payload: {
  publication_id: string | null;
  device_ids: string[];
  starts_at: string;
  ends_at: string | null;
  recurrence?: Recurrence;
  timezone?: string;
  priority?: Priority;
}): Promise<ScheduleConflict[]> {
  if (payload.device_ids.length === 0) return [];
  const data = await requestApi<ScheduleConflict[]>(
    "POST",
    "/media/publications/conflicts",
    payload
  );
  return Array.isArray(data) ? data : [];
}

/** Batch-signs 1h preview URLs for the given media asset ids. Returns id → URL. */
export async function fetchPreviewUrls(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const data = await requestApi<{ urls?: Record<string, string> } | Record<string, string>>(
    "POST",
    "/media/videos/preview-urls",
    { ids }
  );
  if (data && typeof data === "object" && "urls" in data) {
    return (data as { urls?: Record<string, string> }).urls ?? {};
  }
  return (data as Record<string, string>) ?? {};
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return requestApi<PlaylistDetail>("GET", `/media/playlists/${id}`);
}

