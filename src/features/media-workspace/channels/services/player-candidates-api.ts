import type { MediaDeviceHealth } from "../../../../types/domain.ts";
import type { ChannelPlayerCandidate } from "../player-candidates.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function unwrapData(data: unknown): unknown {
  return isRecord(data) && "data" in data ? data.data : data;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function parseCandidate(value: unknown): ChannelPlayerCandidate {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.code) ||
    !(value.model === null || isString(value.model)) ||
    !(value.location === null || isRecord(value.location)) ||
    !isString(value.registry_status) ||
    typeof value.never_connected !== "boolean" ||
    !isOneOf(value.health, ["online", "warning", "offline"]) ||
    !(value.last_heartbeat_at === null || isString(value.last_heartbeat_at)) ||
    !(value.orientation === null || isOneOf(value.orientation, ["landscape", "portrait"])) ||
    !(value.resolution === null || isString(value.resolution)) ||
    !(value.reserved_by_channel === null || isRecord(value.reserved_by_channel))
  ) {
    throw new TypeError("Channel player candidate data is malformed");
  }
  const location = value.location as Record<string, unknown> | null;
  const reservedByChannel = value.reserved_by_channel as Record<string, unknown> | null;
  return {
    id: value.id,
    name: value.name,
    code: value.code,
    model: value.model,
    location: location ? { id: location.id as string, name: location.name as string } : null,
    registryStatus: value.registry_status,
    neverConnected: value.never_connected,
    health: value.health as MediaDeviceHealth,
    lastHeartbeatAt: value.last_heartbeat_at,
    orientation: value.orientation,
    resolution: value.resolution,
    reservedByChannel: reservedByChannel
      ? { id: reservedByChannel.id as string, name: reservedByChannel.name as string }
      : null,
  };
}

export function parseChannelPlayerCandidates(data: unknown): ChannelPlayerCandidate[] {
  const unwrapped = unwrapData(data);
  if (!Array.isArray(unwrapped)) {
    throw new TypeError("Channel player candidate list data must be an array");
  }
  return unwrapped.map(parseCandidate);
}

export async function fetchChannelPlayerCandidates(): Promise<ChannelPlayerCandidate[]> {
  const { requestApi } = await import("../../../../lib/api/media-api.ts");
  return parseChannelPlayerCandidates(await requestApi<unknown>("GET", "/media/channels/player-candidates"));
}
