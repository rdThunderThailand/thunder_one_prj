import { DEFAULT_TIMEZONE, utcToZonedParts } from "./schedule.ts";
import type { PublicationDisplayStatus, PublicationListItem } from "./types";

export const DISPLAY_STATUS_LABELS: Record<PublicationDisplayStatus, string> = {
  draft: "Draft",
  publishing: "Publishing",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
};

export type RowAction = "edit" | "open" | "view" | "publish" | "duplicate" | "delete" | "end";

/** Plan §2 "Programs list": actions by badge. Delete only exists for a Draft; a running Program is
 *  ended (cancel), never deleted. The first entry is the row's primary button. */
export function rowActionsFor(status: PublicationDisplayStatus | undefined): RowAction[] {
  switch (status) {
    case "draft":
      return ["edit", "publish", "duplicate", "delete"];
    case "publishing":
    case "scheduled":
    case "live":
      return ["open", "duplicate", "end"];
    case "ended":
      return ["view", "duplicate"];
    default:
      // Backend older than BE-1: no badge to key on, so offer the safe read-only pair.
      return ["view", "duplicate"];
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "YYYY-MM-DD" -> "12 May 2025" (no Date object, so no viewer-timezone shift). */
function formatYmd(ymd: string): string {
  const [year, month, day] = ymd.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatScheduleRange(item: PublicationListItem): string {
  if (!item.starts_at) return "Not scheduled";
  const zone = item.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(item.starts_at, zone).date;
  if (!item.ends_at) return `From ${formatYmd(start)}`;
  const end = utcToZonedParts(item.ends_at, zone).date;
  return start === end ? formatYmd(start) : `${formatYmd(start)} – ${formatYmd(end)}`;
}

/** Second schedule line. Only `Scheduled` has a future airing worth naming; for the other badges
 *  the row list carries no recurrence, so nothing is invented. */
export function formatNextAiring(item: PublicationListItem): string | null {
  if (item.display_status !== "scheduled" || !item.next_airing_at) return null;
  const zone = item.timezone || DEFAULT_TIMEZONE;
  const next = utcToZonedParts(item.next_airing_at, zone);
  const today = utcToZonedParts(new Date().toISOString(), zone).date;
  return next.date === today
    ? `Next airing ${next.time}`
    : `Next airing ${formatYmd(next.date)} ${next.time}`;
}

export function formatTargetSummary(item: PublicationListItem): string {
  const summary = item.target_summary;
  if (!summary) return "—";
  const parts: string[] = [];
  if (summary.channels > 0) parts.push(`${summary.channels} ${summary.channels === 1 ? "Channel" : "Channels"}`);
  if (summary.devices > 0) parts.push(`${summary.devices} ${summary.devices === 1 ? "Device" : "Devices"}`);
  return parts.length > 0 ? parts.join(" · ") : "No targets";
}

export type DeliveryView = {
  label: string;
  /** "3 / 5 (60%)" — absent when the row has no delivery at all. */
  ratio: string | null;
  percent: number | null;
  /** "1 offline · 2 failed" — absent when both are 0. */
  problems: string | null;
};

/** Deployment / Progress column. `stage3_done` = devices already playing (BE-1 contract). */
export function deliveryView(item: PublicationListItem): DeliveryView {
  const delivery = item.delivery;
  if (!delivery || delivery.total === 0) {
    return {
      label: item.display_status === "draft" ? "Not published" : "No delivery yet",
      ratio: null,
      percent: null,
      problems: null,
    };
  }
  const percent = Math.round((delivery.stage3_done / delivery.total) * 100);
  const problems = [
    delivery.offline > 0 ? `${delivery.offline} offline` : null,
    delivery.failed > 0 ? `${delivery.failed} failed` : null,
  ].filter(Boolean);
  const allPlaying = delivery.stage3_done === delivery.total;
  const label =
    item.display_status === "publishing"
      ? "Publishing…"
      : allPlaying
        ? item.display_status === "ended"
          ? "Completed"
          : "Playing on all"
        : item.display_status === "ended"
          ? "Ended"
          : delivery.stage3_done > 0
            ? "Partly playing"
            : "Not playing yet";
  return {
    label,
    ratio: `${delivery.stage3_done} / ${delivery.total} (${percent}%)`,
    percent,
    problems: problems.length > 0 ? problems.join(" · ") : null,
  };
}
