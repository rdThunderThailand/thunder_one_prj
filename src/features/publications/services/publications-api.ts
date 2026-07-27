import { apiClient } from "@/lib/api/client";
import type { BasicInfoForm, Campaign, Publication, Tag } from "../types";

async function requestApi<T>(
  method: "GET" | "POST" | "PATCH",
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
  publicationId: string | null
): Promise<Publication> {
  const body = cleanBasicInfoBody(form, publicationId);
  const method = publicationId ? "PATCH" : "POST";
  return requestApi<Publication>(method, "/media/publications", body);
}
