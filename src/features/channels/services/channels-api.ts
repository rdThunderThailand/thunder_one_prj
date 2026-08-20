import type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDeviceCandidate,
  ChannelDraftInput,
  ChannelLifecycle,
  ChannelListItem,
  ChannelLocationOption,
  ChannelOrientation,
  ChannelReferenceData,
  ChannelTypeOption,
} from "../types/index.ts";
import { deriveChannelHealth } from "../channel-logic.ts";
import { isDisplayResolution } from "../../../lib/display-resolution.ts";

type ChannelRequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ChannelRequestDescriptor {
  method: ChannelRequestMethod;
  path: string;
  body?: unknown;
}

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
  expected_orientation: ChannelOrientation | null;
  expected_resolution: string | null;
  default_playlist_id: string | null;
  confirm_mismatch: boolean;
}

export interface UpdateChannelBody extends CreateChannelBody {
  expected_revision: number;
  overwrite: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isResolution(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0;
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function unwrapData(data: unknown): unknown {
  return isRecord(data) && "data" in data ? data.data : data;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function assertExpectedRevision(expectedRevision: number): void {
  if (!isPositiveSafeInteger(expectedRevision)) {
    throw new TypeError("Channel expected_revision must be a positive safe integer");
  }
}

function parseChannelType(value: unknown): ChannelTypeOption {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isString(value.name) ||
    !isOneOf(value.channel_category, ["dooh", "in_store", "online", "social"]) ||
    !(value.is_active === undefined || typeof value.is_active === "boolean")
  ) {
    throw new TypeError("Channel type data is malformed");
  }
  const channelType: ChannelTypeOption = {
    id: value.id,
    code: value.code,
    name: value.name,
    channel_category: value.channel_category,
  };
  if (value.is_active !== undefined) channelType.is_active = value.is_active;
  return channelType;
}

function parseChannelLocation(value: unknown): ChannelLocationOption {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) {
    throw new TypeError("Channel location data is malformed");
  }
  return { id: value.id, name: value.name };
}

function parseChannelDevice(value: unknown): ChannelDevice {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.code) ||
    !isOneOf(value.health, ["online", "warning", "offline"]) ||
    !(value.last_heartbeat_at === null || isTimestamp(value.last_heartbeat_at)) ||
    !(value.orientation === null || isOneOf(value.orientation, ["landscape", "portrait"])) ||
    !(value.resolution === null || isResolution(value.resolution))
  ) {
    throw new TypeError("Channel device data is malformed");
  }
  return {
    id: value.id,
    name: value.name,
    code: value.code,
    health: value.health,
    last_heartbeat_at: value.last_heartbeat_at,
    orientation: value.orientation,
    resolution: value.resolution,
  };
}

function parseChannelDeviceCandidate(value: unknown): ChannelDeviceCandidate {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !(value.status_level === undefined || isOneOf(value.status_level, ["online", "warning", "offline"])) ||
    !(
      value.last_heartbeat_at === undefined ||
      value.last_heartbeat_at === null ||
      isTimestamp(value.last_heartbeat_at)
    ) ||
    !(
      value.orientation === undefined ||
      value.orientation === null ||
      isOneOf(value.orientation, ["landscape", "portrait"])
    ) ||
    !(
      value.resolution === undefined ||
      value.resolution === null ||
      isResolution(value.resolution)
    )
  ) {
    throw new TypeError("Channel device candidate data is malformed");
  }
  return {
    id: value.id,
    name: value.name,
    code: null,
    health: value.status_level ?? "offline",
    last_heartbeat_at: value.last_heartbeat_at ?? null,
    orientation: value.orientation ?? null,
    resolution: value.resolution ?? null,
  };
}

function parseChannelListItem(value: unknown): ChannelListItem {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isNullableString(value.description) ||
    !isOneOf(value.lifecycle, ["draft", "active", "inactive"]) ||
    !(
      value.health === null ||
      isOneOf(value.health, ["online", "warning", "offline", "degraded"])
    ) ||
    !isOneOf(value.category, ["dooh", "in_store", "online", "social"]) ||
    !(value.channel_type === null || isRecord(value.channel_type)) ||
    !(value.location === null || isRecord(value.location)) ||
    !Array.isArray(value.devices) ||
    !(value.expected_orientation === null || isOneOf(value.expected_orientation, ["landscape", "portrait"])) ||
    !(value.expected_resolution === null || isDisplayResolution(value.expected_resolution)) ||
    !(value.default_playlist === null || isRecord(value.default_playlist)) ||
    !isPositiveSafeInteger(value.revision) ||
    !isTimestamp(value.updated_at)
  ) {
    throw new TypeError("Channel data is malformed");
  }

  const channelType = value.channel_type === null ? null : parseChannelType(value.channel_type);
  if (channelType !== null && channelType.channel_category !== value.category) {
    throw new TypeError("Channel type category does not match Channel category");
  }
  const location = value.location === null ? null : parseChannelLocation(value.location);
  const defaultPlaylist =
    value.default_playlist === null
      ? null
      : parseChannelLocation(value.default_playlist);

  const devices = value.devices.map(parseChannelDevice);
  const health = deriveChannelHealth(devices.map((device) => device.health));
  if (value.health !== health) {
    throw new TypeError("Channel health does not match device health");
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    lifecycle: value.lifecycle,
    health,
    category: value.category,
    channel_type: channelType,
    location,
    devices,
    expected_orientation: value.expected_orientation,
    expected_resolution: value.expected_resolution,
    default_playlist: defaultPlaylist,
    revision: value.revision,
    updated_at: value.updated_at,
  };
}

/** Uses a lazy import so the runnable pure contract check has no axios dependency. */
async function requestChannelApi<T>(request: ChannelRequestDescriptor): Promise<T> {
  const { requestApi } = await import("../../../lib/api/media-api.ts");
  return requestApi<T>(request.method, request.path, request.body);
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
    confirm_mismatch: draft.confirm_mismatch,
  };
}

export function buildUpdateChannelBody(
  draft: ChannelDraftInput,
  expectedRevision: number,
  overwrite: boolean,
): UpdateChannelBody {
  assertExpectedRevision(expectedRevision);
  return { ...buildCreateChannelBody(draft), expected_revision: expectedRevision, overwrite };
}

export function buildFetchChannelsRequest(
  query: ChannelListQuery = {},
): ChannelRequestDescriptor {
  return { method: "GET", path: buildChannelListPath(query) };
}

export function buildFetchChannelRequest(id: string): ChannelRequestDescriptor {
  return { method: "GET", path: `/media/channels/${id}` };
}

export function buildChannelReferenceDataRequest(): ChannelRequestDescriptor {
  return { method: "GET", path: "/media/channels/reference-data" };
}

export function buildCreateChannelRequest(draft: ChannelDraftInput): ChannelRequestDescriptor {
  return {
    method: "POST",
    path: "/media/channels",
    body: buildCreateChannelBody(draft),
  };
}

export function buildUpdateChannelRequest(
  id: string,
  draft: ChannelDraftInput,
  expectedRevision: number,
  overwrite: boolean,
): ChannelRequestDescriptor {
  return {
    method: "PATCH",
    path: `/media/channels/${id}`,
    body: buildUpdateChannelBody(draft, expectedRevision, overwrite),
  };
}

export function buildDeleteDraftChannelRequest(
  id: string,
  expectedRevision: number,
): ChannelRequestDescriptor {
  assertExpectedRevision(expectedRevision);
  return {
    method: "DELETE",
    path: `/media/channels/${id}`,
    body: { expected_revision: expectedRevision },
  };
}

export function buildActivateChannelRequest(
  id: string,
  expectedRevision: number,
): ChannelRequestDescriptor {
  assertExpectedRevision(expectedRevision);
  return {
    method: "POST",
    path: `/media/channels/${id}/activate`,
    body: { expected_revision: expectedRevision },
  };
}

export function buildDeactivateChannelRequest(
  id: string,
  expectedRevision: number,
): ChannelRequestDescriptor {
  assertExpectedRevision(expectedRevision);
  return {
    method: "POST",
    path: `/media/channels/${id}/deactivate`,
    body: { expected_revision: expectedRevision },
  };
}

export function buildChannelDeviceCandidatesRequest(): ChannelRequestDescriptor {
  return { method: "GET", path: "/media/screens" };
}

export function parseChannelList(data: unknown): ChannelListItem[] {
  const unwrapped = unwrapData(data);
  const channels = Array.isArray(unwrapped)
    ? unwrapped
    : isRecord(unwrapped) && Array.isArray(unwrapped.channels)
      ? unwrapped.channels
      : null;
  if (channels === null) {
    throw new TypeError("Channel list data must be an array or { channels: [] }");
  }
  return channels.map(parseChannelListItem);
}

export function parseChannelDetail(data: unknown): ChannelDetail {
  const unwrapped = unwrapData(data);
  const channel = parseChannelListItem(unwrapped);
  if (!isRecord(unwrapped) || !isTimestamp(unwrapped.created_at)) {
    throw new TypeError("Channel detail data is malformed");
  }
  return { ...channel, created_at: unwrapped.created_at };
}

export function parseChannelReferenceData(data: unknown): ChannelReferenceData {
  const unwrapped = unwrapData(data);
  if (
    !isRecord(unwrapped) ||
    !Array.isArray(unwrapped.channel_types) ||
    !Array.isArray(unwrapped.locations)
  ) {
    throw new TypeError("Channel reference data is malformed");
  }
  return {
    channel_types: unwrapped.channel_types.map(parseChannelType),
    locations: unwrapped.locations.map(parseChannelLocation),
  };
}

export function parseChannelDeviceCandidates(data: unknown): ChannelDeviceCandidate[] {
  const unwrapped = unwrapData(data);
  const candidates = Array.isArray(unwrapped)
    ? unwrapped
    : isRecord(unwrapped) && Array.isArray(unwrapped.screens)
      ? unwrapped.screens
      : null;
  if (candidates === null) {
    throw new TypeError("Channel device candidate data must be an array or { screens: [] }");
  }
  return candidates.map(parseChannelDeviceCandidate);
}

export async function fetchChannels(
  query: ChannelListQuery = {},
): Promise<ChannelListItem[]> {
  const data = await requestChannelApi<unknown>(buildFetchChannelsRequest(query));
  return parseChannelList(data);
}

export async function fetchChannel(id: string): Promise<ChannelDetail> {
  return parseChannelDetail(
    await requestChannelApi<unknown>(buildFetchChannelRequest(id)),
  );
}

export async function fetchChannelReferenceData(): Promise<ChannelReferenceData> {
  return parseChannelReferenceData(
    await requestChannelApi<unknown>(buildChannelReferenceDataRequest()),
  );
}

/** Reads Physical Device candidates only; the result is never interpreted as Channel rows. */
export async function fetchChannelDeviceCandidates(): Promise<ChannelDeviceCandidate[]> {
  return parseChannelDeviceCandidates(
    await requestChannelApi<unknown>(buildChannelDeviceCandidatesRequest()),
  );
}

export async function createChannel(draft: ChannelDraftInput): Promise<ChannelDetail> {
  return parseChannelDetail(
    await requestChannelApi<unknown>(buildCreateChannelRequest(draft)),
  );
}

export async function updateChannel(
  id: string,
  draft: ChannelDraftInput,
  expectedRevision: number,
  overwrite: boolean,
): Promise<ChannelDetail> {
  return parseChannelDetail(
    await requestChannelApi<unknown>(
      buildUpdateChannelRequest(id, draft, expectedRevision, overwrite),
    ),
  );
}

export async function deleteDraftChannel(id: string, expectedRevision: number): Promise<void> {
  await requestChannelApi<unknown>(buildDeleteDraftChannelRequest(id, expectedRevision));
}

export async function activateChannel(id: string, expectedRevision: number): Promise<void> {
  await requestChannelApi<unknown>(buildActivateChannelRequest(id, expectedRevision));
}

export async function deactivateChannel(id: string, expectedRevision: number): Promise<void> {
  await requestChannelApi<unknown>(buildDeactivateChannelRequest(id, expectedRevision));
}
