import type { ChannelGroup, ChannelGroupCreateInput, ChannelGroupMember, ChannelGroupUpdateInput } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function unwrapData(data: unknown): unknown {
  return isRecord(data) && "data" in data ? data.data : data;
}

function parseMember(value: unknown): ChannelGroupMember {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) {
    throw new TypeError("Channel group member must have id and name");
  }
  return { id: value.id, name: value.name };
}

export function parseChannelGroup(value: unknown): ChannelGroup {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isNullableString(value.description) ||
    !isOneOf(value.status, ["active", "disabled"] as const) ||
    !isOneOf(value.playback_mode, ["synchronized", "independent"] as const) ||
    !Array.isArray(value.members) ||
    typeof value.member_count !== "number" ||
    !isString(value.created_at) ||
    !isString(value.updated_at)
  ) {
    throw new TypeError("Malformed channel group payload");
  }
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    status: value.status,
    playback_mode: value.playback_mode,
    members: value.members.map(parseMember),
    member_count: value.member_count,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export function parseChannelGroupList(data: unknown): ChannelGroup[] {
  const unwrapped = unwrapData(data);
  if (!Array.isArray(unwrapped)) {
    throw new TypeError("Channel group list data must be an array");
  }
  return unwrapped.map(parseChannelGroup);
}

async function requestApi<T>(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", path: string, data?: unknown): Promise<T> {
  const { requestApi: request } = await import("../../../../lib/api/media-api.ts");
  return request<T>(method, path, data);
}

export async function fetchChannelGroups(): Promise<ChannelGroup[]> {
  return parseChannelGroupList(await requestApi<unknown>("GET", "/media/channel-groups"));
}

export async function fetchChannelGroup(id: string): Promise<ChannelGroup> {
  return parseChannelGroup(unwrapData(await requestApi<unknown>("GET", `/media/channel-groups/${id}`)));
}

export async function createChannelGroup(input: ChannelGroupCreateInput): Promise<ChannelGroup> {
  return parseChannelGroup(
    unwrapData(
      await requestApi<unknown>("POST", "/media/channel-groups", {
        name: input.name,
        description: input.description ?? null,
        playback_mode: input.playback_mode,
      })
    )
  );
}

export async function updateChannelGroup(id: string, input: ChannelGroupUpdateInput): Promise<ChannelGroup> {
  return parseChannelGroup(unwrapData(await requestApi<unknown>("PATCH", `/media/channel-groups/${id}`, input)));
}

export async function deleteChannelGroup(id: string): Promise<void> {
  await requestApi<unknown>("DELETE", `/media/channel-groups/${id}`);
}

export async function setChannelGroupMembers(id: string, channelIds: string[]): Promise<ChannelGroup> {
  return parseChannelGroup(
    unwrapData(await requestApi<unknown>("PUT", `/media/channel-groups/${id}/members`, { channel_ids: channelIds }))
  );
}

/** `media_channel_groups_set_members` / `_update` / `media_channel_set_groups` all raise this
 *  shape from the same partial unique index (ADR 0074 §5) — the raw text already names both
 *  Groups, so it is shown as-is rather than routed through `classifyApiError`'s generic
 *  "Invalid input:" bucket, which would otherwise swallow the names. */
export function isSyncConflict(message: string): boolean {
  return (
    message.includes("already synchronized elsewhere") ||
    message.includes("already in another synchronized group") ||
    message.includes("only one synchronized group")
  );
}

/** `media_channel_groups_delete` refuses while any Publication still targets the Group. */
export function isGroupInUse(message: string): boolean {
  return message.startsWith("Already in use:");
}
