import type {
  ChannelDevice,
  ChannelDeviceCandidate,
  ChannelDraftInput,
  ChannelFilters,
  ChannelListItem,
  ChannelOrientation,
  ChannelTypeOption,
} from "./types/index.ts";

export type DeviceCompatibility =
  | "compatible"
  | "orientation-mismatch"
  | "resolution-mismatch"
  | "profile-unavailable"
  | "not-checked";

export function getDeviceCompatibility(
  device: ChannelDeviceCandidate,
  expectedOrientation: ChannelOrientation | null,
  expectedResolution: string | null,
): DeviceCompatibility {
  if (!expectedOrientation && !expectedResolution) return "not-checked";
  if (
    expectedOrientation &&
    device.orientation !== null &&
    device.orientation !== expectedOrientation
  ) {
    return "orientation-mismatch";
  }
  if (
    expectedResolution &&
    device.resolution !== null &&
    device.resolution !== expectedResolution
  ) {
    return "resolution-mismatch";
  }
  if (
    (expectedOrientation && device.orientation === null) ||
    (expectedResolution && device.resolution === null)
  ) {
    return "profile-unavailable";
  }
  return "compatible";
}

export function shouldConfirmResolutionMismatch(
  selectedDevices: readonly ChannelDeviceCandidate[],
  expectedResolution: string | null,
  confirmedDeviceIds: ReadonlySet<string>,
): boolean {
  if (!expectedResolution) return false;
  const mismatches = selectedDevices.filter(
    (device) => device.resolution !== null && device.resolution !== expectedResolution,
  );
  return (
    mismatches.length > 0 &&
    mismatches.every((device) => confirmedDeviceIds.has(device.id))
  );
}

export function mergeChannelDeviceCandidates(
  candidates: readonly ChannelDeviceCandidate[],
  assignedDevices: readonly ChannelDevice[],
): ChannelDeviceCandidate[] {
  const assignedById = new Map(assignedDevices.map((device) => [device.id, device]));
  const candidateIds = new Set(candidates.map((device) => device.id));
  const merged = candidates.map((candidate) => {
    const assigned = assignedById.get(candidate.id);
    if (!assigned) return candidate;
    return {
      ...candidate,
      code: assigned.code ?? candidate.code,
      orientation: assigned.orientation ?? candidate.orientation,
      resolution: assigned.resolution ?? candidate.resolution,
    };
  });
  return [
    ...merged,
    ...assignedDevices
      .filter((device) => !candidateIds.has(device.id))
      .map((device) => ({ ...device })),
  ];
}

export function mergeChannelTypeOptions(
  referenceTypes: readonly ChannelTypeOption[],
  currentType: ChannelTypeOption | null,
): ChannelTypeOption[] {
  if (!currentType || referenceTypes.some((option) => option.id === currentType.id)) {
    return [...referenceTypes];
  }
  return [...referenceTypes, { ...currentType, is_active: false }];
}

/** How much of a Channel is actually up. ADR 0037 replaced the channel-level health value
 * with this count, so "Active" and "2/3 online" are two separate facts on the row. */
export function countOnlineDevices(devices: readonly Pick<ChannelDevice, "health">[]): number {
  return devices.filter((device) => device.health === "online").length;
}

export function summarizeChannels(channels: readonly ChannelListItem[]) {
  const summary = {
    lifecycle: { total: channels.length, draft: 0, active: 0, inactive: 0 },
    devices: { total: 0, online: 0 },
    unassigned: 0,
  };

  for (const channel of channels) {
    summary.lifecycle[channel.lifecycle] += 1;
    summary.devices.total += channel.devices.length;
    summary.devices.online += countOnlineDevices(channel.devices);
    if (channel.devices.length === 0) summary.unassigned += 1;
  }

  return summary;
}

export function filterChannels(
  channels: readonly ChannelListItem[],
  filters: ChannelFilters,
): ChannelListItem[] {
  const search = filters.search.trim().toLowerCase();

  return channels.filter((channel) => {
    const matchesSearch =
      search.length === 0 ||
      channel.name.toLowerCase().includes(search) ||
      channel.location?.name.toLowerCase().includes(search) ||
      channel.devices.some(
        (device) =>
          device.name.toLowerCase().includes(search) || device.code.toLowerCase().includes(search),
      );
    const matchesCategory = filters.category === "all" || channel.category === filters.category;
    const matchesLifecycle = filters.lifecycle === "all" || channel.lifecycle === filters.lifecycle;

    return matchesSearch && matchesCategory && matchesLifecycle;
  });
}

export function formatChannelLastSeen(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "Never connected";
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export function validateChannelDraft(input: ChannelDraftInput): Partial<Record<"name" | "channel_type_id", string>> {
  const errors: Partial<Record<"name" | "channel_type_id", string>> = {};
  if (!input.name.trim()) errors.name = "กรุณาระบุชื่อ Channel";
  if (!input.channel_type_id) errors.channel_type_id = "กรุณาเลือก Channel Type";
  return errors;
}
