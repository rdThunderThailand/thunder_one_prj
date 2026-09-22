/**
 * Minimal read for D1's "Channel Groups" tile: it must count every Group, including empty
 * ones, so it agrees with ticket 10's Channel Groups page (same `/media/channel-groups`
 * source) once that page exists. Full Channel Group CRUD is ticket 10's, not this one's.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function unwrapData(data: unknown): unknown {
  return isRecord(data) && "data" in data ? data.data : data;
}

export function parseChannelGroupsCount(data: unknown): number {
  const unwrapped = unwrapData(data);
  if (!Array.isArray(unwrapped)) {
    throw new TypeError("Channel groups list data must be an array");
  }
  return unwrapped.length;
}

export async function fetchChannelGroupsCount(): Promise<number> {
  const { requestApi } = await import("../../../../lib/api/media-api.ts");
  return parseChannelGroupsCount(await requestApi<unknown>("GET", "/media/channel-groups"));
}
