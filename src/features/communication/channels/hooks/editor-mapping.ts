// Pure form <-> API mapping for useChannelEditor.ts, split out so the hook stays
// focused on state and effects.

import { shouldConfirmResolutionMismatch } from "../channel-logic";
import type { ChannelCategory, ChannelDetail, ChannelDeviceCandidate, ChannelDraftInput } from "../types";
import type { ChannelFormValue } from "./useChannelEditor";

export const emptyForm: ChannelFormValue = {
  name: "",
  category: "in_store",
  channelTypeId: "",
  locationId: "",
  description: "",
  deviceIds: [],
  orientation: null,
  resolution: null,
  defaultPlaylistId: "",
};

export function mergePlaylistOptions(
  playlists: { id: string; name: string }[],
  detail: ChannelDetail | null,
): { id: string; name: string }[] {
  if (!detail?.default_playlist) return playlists;
  return playlists.some((playlist) => playlist.id === detail.default_playlist?.id)
    ? playlists
    : [...playlists, detail.default_playlist];
}

export function detailToForm(detail: ChannelDetail): ChannelFormValue {
  return {
    name: detail.name,
    category: detail.category,
    channelTypeId: detail.channel_type?.id ?? "",
    locationId: detail.location?.id ?? "",
    description: detail.description ?? "",
    deviceIds: detail.devices.map((device) => device.id),
    orientation: detail.expected_orientation,
    resolution: detail.expected_resolution,
    defaultPlaylistId: detail.default_playlist?.id ?? "",
  };
}

export function toDraft(
  form: ChannelFormValue,
  devices: readonly ChannelDeviceCandidate[],
  resolutionConfirmations: ReadonlySet<string>,
  asDraft: boolean | null,
): ChannelDraftInput {
  const selectedDevices = devices.filter((device) => form.deviceIds.includes(device.id));
  return {
    name: form.name,
    description: form.description.trim() || null,
    category: form.category,
    channel_type_id: form.channelTypeId,
    location_id: form.locationId || null,
    device_ids: form.deviceIds,
    expected_orientation: form.orientation,
    expected_resolution: form.resolution,
    default_playlist_id: form.defaultPlaylistId || null,
    confirm_mismatch: shouldConfirmResolutionMismatch(
      selectedDevices,
      form.resolution,
      resolutionConfirmations,
    ),
    as_draft: asDraft,
  };
}

export function isSupportedCategory(category: ChannelCategory): category is "dooh" | "in_store" {
  return category === "dooh" || category === "in_store";
}

export const DUPLICATE_NAME_MESSAGE = "ชื่อ Channel นี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่น";
