import { requestApi } from "@/lib/api/media-api";
import { ALL_CHANNELS, type ChannelScope } from "../channels/channel-scope";
import type { ChannelOutputKind } from "../channels/types";

export type NowNextPriority = "urgent" | "high" | "normal" | "low";

/** What a Program plays. `id` is set only for a Layout or a user Playlist — the two that have an editor page. */
export type NowNextContent = {
  kind: "playlist" | "layout" | "image" | "video" | "other";
  id: string | null;
  name: string | null;
};

export type NowNextPublication = {
  id: string;
  name: string;
  publication_type: string;
  content_name: string | null;
  content: NowNextContent;
  thumbnail_url?: string | null;
};

export type NowNextChannel = {
  id: string;
  name: string;
  location_name: string | null;
  output_kind: ChannelOutputKind;
  expected_resolution: string | null;
};

export type NowNextOccurrence = {
  occurrence_id: string;
  opens_at: string;
  closes_at: string | null;
  remaining_seconds: number | null;
  priority: NowNextPriority;
  output_kind: "publication" | "merged_loop";
  publications: NowNextPublication[];
  scheduled_now: boolean;
  playback_state: "confirmed" | "stale" | "not_confirmed";
  suppressed: Array<{ id: string; name: string; priority: string }>;
};

export type NowNextRow = {
  row_type: "channel" | "direct_device";
  channel: NowNextChannel | null;
  device: { id: string; name: string } | null;
  devices: Array<{ id: string; name: string; status_level: "online" | "warning" | "offline"; last_heartbeat_at: string | null; playback_state: "confirmed" | "stale" | "not_confirmed" }>;
  current: NowNextOccurrence | null;
  upcoming: NowNextOccurrence[];
  suppressed_count: number;
};

export type NowNextResponse = {
  as_of: string;
  display_timezone: string;
  horizon_minutes: 60 | 180;
  freshness: { online_before: string; warning_before: string };
  summary: { scheduled_now_channels: number; playback_confirmed_channels: number; upcoming_60m_channels: number; upcoming_3h_channels: number; total_active_channels: number };
  rows: NowNextRow[];
};

/** The page always asks for 3 hours (ADR 0084 §5); the other callers keep passing 60. */
export function fetchNowNext(horizon: 60 | 180, includeIdle: boolean, scope: ChannelScope = ALL_CHANNELS) {
  const params = new URLSearchParams({ horizon_minutes: String(horizon), include_idle: String(includeIdle) });
  if (scope.kind === "group") params.set("group_id", scope.id);
  if (scope.kind === "channel") params.set("channel_id", scope.id);
  return requestApi<NowNextResponse>("GET", `/media/now-next?${params}`);
}
