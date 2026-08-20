import type { MediaDeviceHealth } from "../../../types/domain.ts";

export type ChannelLifecycle = "draft" | "active" | "inactive";
export type ChannelHealth = MediaDeviceHealth | "degraded" | null;
export type ChannelCategory = "dooh" | "in_store" | "online" | "social";
export type ChannelOrientation = "landscape" | "portrait";

export interface ChannelDevice {
  id: string;
  name: string;
  code: string;
  health: MediaDeviceHealth;
}

export interface ChannelListItem {
  id: string;
  name: string;
  description: string | null;
  lifecycle: ChannelLifecycle;
  health: ChannelHealth;
  category: ChannelCategory;
  channel_type: { id: string; code: string; name: string } | null;
  location: { id: string; name: string } | null;
  devices: ChannelDevice[];
  expected_orientation: ChannelOrientation | null;
  expected_resolution: string | null;
  default_playlist: { id: string; name: string } | null;
  revision: number;
  updated_at: string;
}

export interface ChannelDetail extends ChannelListItem {
  created_at: string;
}

export interface ChannelDraftInput {
  name: string;
  description?: string | null;
  category: ChannelCategory;
  channel_type_id: string;
  location_id?: string | null;
  device_ids: string[];
  expected_orientation?: ChannelOrientation | null;
  expected_resolution?: string | null;
  default_playlist_id?: string | null;
}

export interface ChannelTypeOption {
  id: string;
  code: string;
  name: string;
}

export interface ChannelFilters {
  search: string;
  category: ChannelCategory | "all";
  lifecycle: ChannelLifecycle | "all";
  health: Exclude<ChannelHealth, null> | "unknown" | "all";
}
