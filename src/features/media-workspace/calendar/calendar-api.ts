import { requestApi } from "@/lib/api/media-api";
import type { ChannelScope } from "../channels/channel-scope";
import type { NowNextChannel, NowNextPriority, NowNextPublication } from "../publications/now-next";

export type CalendarPublication = NowNextPublication & { schedule_ends_at: string | null };

export type CalendarSegment = {
  opens_at: string;
  closes_at: string;
  priority: NowNextPriority;
  output_kind: "publication" | "merged_loop";
  publications: CalendarPublication[];
  /** Programs scheduled in this block but overridden, with the spans where they were (ADR 0085 Rev.2 §10).
   *  `spans` is missing from a Core without the BE-C migration; the page then shows no overridden lanes. */
  suppressed: Array<{ id: string; name: string; priority: NowNextPriority; spans?: Array<{ opens_at: string; closes_at: string }> }>;
  /** The Program's whole occurrence when this block is only part of it; null for a merged loop. */
  occurrence: { opens_at: string; closes_at: string | null } | null;
};

export type CalendarRow = {
  row_type: "channel" | "direct_device";
  channel: NowNextChannel | null;
  device: { id: string; name: string } | null;
  segments: CalendarSegment[];
};

export type CalendarResponse = {
  from: string;
  to: string;
  as_of: string;
  display_timezone: string;
  rows: CalendarRow[];
};

export function fetchCalendar(from: string, to: string, scope: ChannelScope) {
  const params = new URLSearchParams({ from, to });
  if (scope.kind === "group") params.set("group_id", scope.id);
  if (scope.kind === "channel") params.set("channel_id", scope.id);
  return requestApi<CalendarResponse>("GET", `/media/calendar?${params}`);
}
