import type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDisplayArrangement,
  ChannelDisplayConfig,
  ChannelDisplayConfigScreen,
  ChannelGroupSummary,
  ChannelLifecycle,
  ChannelListItem,
  ChannelLocationOption,
  ChannelReferenceData,
  ChannelTypeOption,
} from "../types/index.ts";
import { isDisplayResolution } from "../../../../lib/display-resolution.ts";

type ChannelRequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ChannelRequestDescriptor {
  method: ChannelRequestMethod;
  path: string;
  body?: unknown;
}

export interface ChannelListQuery {
  category?: ChannelCategory;
  lifecycle?: ChannelLifecycle;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
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
    !(value.resolution === null || isResolution(value.resolution)) ||
    !(
      value.sync_phase_error_ms === undefined ||
      value.sync_phase_error_ms === null ||
      isNumber(value.sync_phase_error_ms)
    ) ||
    !(
      value.sync_loop_duration_seconds === undefined ||
      value.sync_loop_duration_seconds === null ||
      isNumber(value.sync_loop_duration_seconds)
    )
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
    sync_phase_error_ms: value.sync_phase_error_ms ?? null,
    sync_loop_duration_seconds: value.sync_loop_duration_seconds ?? null,
  };
}

function parseChannelGroup(value: unknown): ChannelGroupSummary {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isOneOf(value.playback_mode, ["synchronized", "independent"])
  ) {
    throw new TypeError("Channel group data is malformed");
  }
  return { id: value.id, name: value.name, playback_mode: value.playback_mode };
}

function parseChannelDisplayConfigScreen(value: unknown): ChannelDisplayConfigScreen {
  if (
    !isRecord(value) ||
    !isNonNegativeSafeInteger(value.index) ||
    !isResolution(value.resolution) ||
    !isString(value.output)
  ) {
    throw new TypeError("Channel display_config screen data is malformed");
  }
  return { index: value.index as number, resolution: value.resolution, output: value.output };
}

/** `media_core.channel_canvas` stores `arrangement` as `{rows, cols}` — not a string. */
function parseChannelDisplayArrangement(value: unknown): ChannelDisplayArrangement {
  if (!isRecord(value) || !isPositiveSafeInteger(value.rows) || !isPositiveSafeInteger(value.cols)) {
    throw new TypeError("Channel display_config arrangement is malformed");
  }
  return { rows: value.rows, cols: value.cols };
}

/** ADR 0074 §3. `null` on a single-screen Channel. */
function parseChannelDisplayConfig(value: unknown): ChannelDisplayConfig | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isOneOf(value.mode, ["single", "multi"]) || !Array.isArray(value.screens)) {
    throw new TypeError("Channel display_config is malformed");
  }
  return {
    mode: value.mode,
    arrangement: parseChannelDisplayArrangement(value.arrangement),
    screens: value.screens.map(parseChannelDisplayConfigScreen),
  };
}

function parseChannelListItem(value: unknown): ChannelListItem {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isNullableString(value.description) ||
    !isOneOf(value.lifecycle, ["draft", "active", "inactive"]) ||
    !isOneOf(value.category, ["dooh", "in_store", "online", "social"]) ||
    !(value.channel_type === null || isRecord(value.channel_type)) ||
    !(value.location === null || isRecord(value.location)) ||
    !isOneOf(value.output_kind, ["screen", "tv", "kiosk"]) ||
    !(value.health === null || isOneOf(value.health, ["online", "warning", "offline"])) ||
    !(value.player === null || isRecord(value.player)) ||
    !Array.isArray(value.groups) ||
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

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    lifecycle: value.lifecycle,
    category: value.category,
    channel_type: channelType,
    location,
    player: value.player === null ? null : parseChannelDevice(value.player),
    health: value.health,
    output_kind: value.output_kind,
    display_config: parseChannelDisplayConfig(value.display_config),
    groups: value.groups.map(parseChannelGroup),
    expected_orientation: value.expected_orientation,
    expected_resolution: value.expected_resolution,
    default_playlist: defaultPlaylist,
    revision: value.revision,
    updated_at: value.updated_at,
  };
}

/** Uses a lazy import so the runnable pure contract check has no axios dependency. */
async function requestChannelApi<T>(request: ChannelRequestDescriptor): Promise<T> {
  const { requestApi } = await import("../../../../lib/api/media-api.ts");
  return requestApi<T>(request.method, request.path, request.body);
}

export function buildChannelListPath(query: ChannelListQuery = {}): string {
  const searchParams = new URLSearchParams();
  if (query.category) searchParams.set("category", query.category);
  if (query.lifecycle) searchParams.set("lifecycle", query.lifecycle);
  const suffix = searchParams.toString();
  return suffix ? `/media/channels?${suffix}` : "/media/channels";
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

export function buildChannelGroupOptionsRequest(): ChannelRequestDescriptor {
  return { method: "GET", path: "/media/channel-groups" };
}

export function buildSetChannelGroupsRequest(id: string, groupIds: string[]): ChannelRequestDescriptor {
  return { method: "PUT", path: `/media/channels/${id}/groups`, body: { group_ids: groupIds } };
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

export async function deleteDraftChannel(id: string, expectedRevision: number): Promise<void> {
  await requestChannelApi<unknown>(buildDeleteDraftChannelRequest(id, expectedRevision));
}

export async function deactivateChannel(id: string, expectedRevision: number): Promise<ChannelDetail> {
  return parseChannelDetail(
    await requestChannelApi<unknown>(buildDeactivateChannelRequest(id, expectedRevision)),
  );
}

export function parseChannelGroupOptions(data: unknown): ChannelGroupSummary[] {
  const unwrapped = unwrapData(data);
  if (!Array.isArray(unwrapped)) {
    throw new TypeError("Channel group options data must be an array");
  }
  return unwrapped.map(parseChannelGroup);
}

/** D9: every Channel Group, for the "which Groups is this Channel in" checklist. */
export async function fetchChannelGroupOptions(): Promise<ChannelGroupSummary[]> {
  return parseChannelGroupOptions(await requestChannelApi<unknown>(buildChannelGroupOptionsRequest()));
}

/** `media_channel_set_groups` (ADR 0074 §5) — replaces the whole Group set for one Channel. */
export async function setChannelGroups(id: string, groupIds: string[]): Promise<ChannelDetail> {
  return parseChannelDetail(
    await requestChannelApi<unknown>(buildSetChannelGroupsRequest(id, groupIds)),
  );
}

/** Same partial-unique-index text as `media_channel_groups_set_members` on the other side of
 *  this many-to-many (ADR 0074 §5) — shown as-is rather than the generic "Invalid input:" text. */
export function isChannelGroupSyncConflict(message: string): boolean {
  return message.includes("already in another synchronized group") || message.includes("only one synchronized group");
}
