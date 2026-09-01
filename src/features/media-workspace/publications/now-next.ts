export type NowNextPriority = "urgent" | "high" | "normal" | "low";

export type NowNextOccurrence = {
  occurrence_id: string;
  opens_at: string;
  closes_at: string | null;
  remaining_seconds: number | null;
  priority: NowNextPriority;
  output_kind: "publication" | "merged_loop";
  publications: Array<{ id: string; name: string; publication_type: string; content_name: string | null; thumbnail_url?: string | null }>;
  scheduled_now: boolean;
  playback_state: "confirmed" | "stale" | "not_confirmed";
  suppressed: Array<{ id: string; name: string; priority: string }>;
};

export type NowNextRow = {
  row_type: "channel" | "direct_device";
  channel: { id: string; name: string } | null;
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
