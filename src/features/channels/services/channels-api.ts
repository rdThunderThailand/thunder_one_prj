import type {
  ChannelCategory,
  ChannelDetail,
  ChannelDraftInput,
  ChannelLifecycle,
  ChannelListItem,
  ChannelReferenceData,
} from "../types/index.ts";

export interface ChannelListQuery {
  category?: ChannelCategory;
  lifecycle?: ChannelLifecycle;
}

export interface CreateChannelBody {
  name: string;
  description: string | null;
  channel_category: ChannelCategory;
  channel_type_id: string;
  location_id: string | null;
  device_ids: string[];
  expected_orientation: ChannelDraftInput["expected_orientation"];
  expected_resolution: string | null;
  default_playlist_id: string | null;
}

export interface UpdateChannelBody extends CreateChannelBody {
  expected_revision: number;
}

type ChannelListResponse =
  | ChannelListItem[]
  | { channels?: ChannelListItem[] }
  | { data: ChannelListItem[] | { channels?: ChannelListItem[] } };

type ChannelReferenceDataResponse =
  | ChannelReferenceData
  | { data: ChannelReferenceData };

type RequestMethod = Parameters<
  typeof import("../../../lib/api/media-api.ts").requestApi
>[0];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function unwrapData<T>(data: T | { data: T }): T {
  if (isRecord(data) && "data" in data) {
    return data.data as T;
  }
  return data as T;
}

/** Uses a lazy import so the runnable request-builder contract check has no axios dependency. */
async function requestChannelApi<T>(
  method: RequestMethod,
  path: string,
  data?: unknown,
): Promise<T> {
  const { requestApi } = await import("../../../lib/api/media-api.ts");
  return requestApi<T>(method, path, data);
}

export function buildChannelListPath(query: ChannelListQuery = {}): string {
  const searchParams = new URLSearchParams();
  if (query.category) searchParams.set("category", query.category);
  if (query.lifecycle) searchParams.set("lifecycle", query.lifecycle);
  const suffix = searchParams.toString();
  return suffix ? `/media/channels?${suffix}` : "/media/channels";
}

export function buildCreateChannelBody(draft: ChannelDraftInput): CreateChannelBody {
  return {
    name: draft.name,
    description: draft.description ?? null,
    channel_category: draft.category,
    channel_type_id: draft.channel_type_id,
    location_id: draft.location_id ?? null,
    device_ids: draft.device_ids,
    expected_orientation: draft.expected_orientation ?? null,
    expected_resolution: draft.expected_resolution ?? null,
    default_playlist_id: draft.default_playlist_id ?? null,
  };
}

export function buildUpdateChannelBody(
  draft: ChannelDraftInput,
  expectedRevision: number,
): UpdateChannelBody {
  return { ...buildCreateChannelBody(draft), expected_revision: expectedRevision };
}

export function parseChannelList(data: ChannelListResponse): ChannelListItem[] {
  const unwrapped = unwrapData(data);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (isRecord(unwrapped) && Array.isArray(unwrapped.channels)) {
    return unwrapped.channels as ChannelListItem[];
  }
  throw new TypeError("Channel list data must be an array or { channels: [] }");
}

export function parseChannelReferenceData(
  data: ChannelReferenceDataResponse,
): ChannelReferenceData {
  const unwrapped = unwrapData(data);
  if (!isRecord(unwrapped)) {
    throw new TypeError("Channel reference data must be an object");
  }
  return unwrapped as ChannelReferenceData;
}

export async function fetchChannels(
  query: ChannelListQuery = {},
): Promise<ChannelListItem[]> {
  const data = await requestChannelApi<ChannelListResponse>(
    "GET",
    buildChannelListPath(query),
  );
  return parseChannelList(data);
}

export async function fetchChannel(id: string): Promise<ChannelDetail> {
  return requestChannelApi<ChannelDetail>("GET", `/media/channels/${id}`);
}

export async function fetchChannelReferenceData(): Promise<ChannelReferenceData> {
  const data = await requestChannelApi<ChannelReferenceDataResponse>(
    "GET",
    "/media/channels/reference-data",
  );
  return parseChannelReferenceData(data);
}

export async function createChannel(draft: ChannelDraftInput): Promise<ChannelDetail> {
  return requestChannelApi<ChannelDetail>(
    "POST",
    "/media/channels",
    buildCreateChannelBody(draft),
  );
}

export async function updateChannel(
  id: string,
  draft: ChannelDraftInput,
  expectedRevision: number,
): Promise<ChannelDetail> {
  return requestChannelApi<ChannelDetail>(
    "PATCH",
    `/media/channels/${id}`,
    buildUpdateChannelBody(draft, expectedRevision),
  );
}

export async function deleteDraftChannel(id: string): Promise<void> {
  await requestChannelApi<unknown>("DELETE", `/media/channels/${id}`);
}

export async function activateChannel(id: string): Promise<void> {
  await requestChannelApi<unknown>("POST", `/media/channels/${id}/activate`);
}

export async function deactivateChannel(id: string): Promise<void> {
  await requestChannelApi<unknown>("POST", `/media/channels/${id}/deactivate`);
}
