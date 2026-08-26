import { requestApi } from "@/lib/api/media-api";

// Shared media endpoints live in the lib layer; re-exported so existing call sites
// keep importing from this service.
export { fetchCampaigns, fetchMediaAssets, fetchTags } from "@/lib/api/media-api";
import type {
  BasicInfoForm,
  ContentItem,
  Priority,
  Publication,
  PublicationDetail,
  PublicationListItem,
  PublicationSchedule,
  PublicationTarget,
  Recurrence,
  ScheduleConflict,
  SchedulePayload,
} from "../types";

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
  if (form.playlist_id?.trim()) {
    body.playlist_id = form.playlist_id.trim();
  }
  if (form.composition_id?.trim()) {
    body.composition_id = form.composition_id.trim();
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
  targets?: PublicationTarget[],
  expectedRevision?: number | null,
  idempotencyKey?: string
): Promise<Publication> {
  const body = cleanBasicInfoBody(form, publicationId);
  // PATCH replaces every field it receives, so the caller must always post the
  // whole form. `targets` is the exception: omitting the key leaves the saved
  // targets untouched, which is what steps 1 and 2 want.
  if (targets) {
    body.targets = targets;
  }
  // Only meaningful on an update — a fresh draft (POST) has no revision to
  // race against yet. `media_publication_upsert` skips the check when omitted.
  if (publicationId && expectedRevision != null) {
    body.expected_revision = expectedRevision;
  }
  // Only sent on create: PATCH already addresses the row by publication_id and
  // never needs a dedupe key.
  if (!publicationId && idempotencyKey) {
    body.idempotency_key = idempotencyKey;
  }
  const method = publicationId ? "PATCH" : "POST";
  return requestApi<Publication>(method, "/media/publications", body);
}

export async function fetchPublications(
  status: "draft" | "active" | "cancelled"
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

export async function duplicatePublication(
  id: string
): Promise<{ publication_id: string; playlist_id: string | null }> {
  return requestApi("POST", `/media/publications/${id}/duplicate`);
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

/** Retries failed/offline-stuck targets. Omit deviceIds to retry every eligible target. */
export async function retryPublicationTargets(
  id: string,
  deviceIds?: string[]
): Promise<{ retried_count: number; skipped_count: number }> {
  return requestApi<{ retried_count: number; skipped_count: number }>(
    "POST",
    `/media/publications/${id}/retry`,
    deviceIds ? { device_ids: deviceIds } : {}
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
