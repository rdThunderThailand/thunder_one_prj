import type {
  PublicationDeliveryTarget,
  PublicationPlaybackWindow,
  PublicationSchedule,
} from "./types";

export type Stage2Status =
  | "queued"
  | "in-progress"
  | "blocked-offline"
  | "expired"
  | "completed"
  | "failed";

export type Stage3Status = "not-reached" | "pending" | "waiting-scheduled" | "confirmed";

export type DeviceResult = "success" | "processing" | "warning" | "error";

export type DeviceProgress = {
  deviceId: string;
  deviceName: string;
  stage2: Stage2Status;
  stage3: Stage3Status;
  result: DeviceResult;
  /** Which stage an error happened in. `publish_job_targets.status` only holds the current
   * state, not history, so a target that fails after being delivered is indistinguishable from
   * one that never delivered — both surface here as "delivery".
   * ponytail: attribute all target-level failures to delivery; a status-history table would be
   * needed to tell delivery failures from playback failures, add if that distinction is asked for. */
  errorStage: "delivery" | null;
};

export type DeliveryRow = { target: PublicationDeliveryTarget; progress: DeviceProgress };

export type PublishResult =
  | "Publishing"
  | "Published Successfully"
  | "Completed with Warnings"
  | "Publish Failed"
  | "Cancelled";

export type DeliverySummary = {
  total: number;
  stage2Done: number;
  stage3Done: number;
  overallPercent: number;
  connected: number;
  delivered: number;
  downloading: number;
  offline: number;
  failed: number;
  result: PublishResult;
  /** When the run reached `result`, or null while it's still `Publishing`. There is no stored
   * "completed at" column — for Cancelled this reads `publications.cancelled_at`; for every other
   * settled result it's the latest target `updated_at`/`acked_at`, i.e. whenever the last device
   * to report in did so. */
  completedAt: string | null;
};

// ponytail: fixed window — tie to next_poll_after_seconds if the device poll cadence changes.
const SETTLE_WINDOW_MS = 10 * 60_000;

function isOffline(target: PublicationDeliveryTarget): boolean {
  return target.status_level === "offline";
}

/** media_job_poll only ever hands out jobs while `now() < schedule.ends_at` — once that passes,
 * a target still stuck at pending/downloading will never be picked up again, online device or
 * not. Without this check that target reads "queued" forever with no explanation and no retry
 * offered, when it's actually dead. */
function isScheduleExpired(schedule: PublicationSchedule | null | undefined, now: Date): boolean {
  return Boolean(schedule?.ends_at && new Date(schedule.ends_at).getTime() <= now.getTime());
}

export function deriveDeviceProgress(
  target: PublicationDeliveryTarget,
  schedule: PublicationSchedule | null | undefined,
  now: Date,
  playbackWindow?: PublicationPlaybackWindow | null
): DeviceProgress {
  const deviceId = target.device_id;
  const deviceName = target.device_name ?? deviceId;
  const expired = isScheduleExpired(schedule, now);

  let stage2: Stage2Status;
  switch (target.status) {
    case "playing":
    case "delivered":
      stage2 = "completed";
      break;
    case "downloading":
      stage2 = expired ? "expired" : "in-progress";
      break;
    case "failed":
      stage2 = "failed";
      break;
    default:
      stage2 = expired ? "expired" : isOffline(target) ? "blocked-offline" : "queued";
  }

  let stage3: Stage3Status = "not-reached";
  if (stage2 === "completed") {
    if (target.status === "playing") {
      stage3 = "confirmed";
    } else {
      const startsAt = schedule?.starts_at ? new Date(schedule.starts_at) : null;
      const isWaitingForWindow =
        playbackWindow?.state === "before" || playbackWindow?.state === "between";
      stage3 = isWaitingForWindow || (startsAt && startsAt.getTime() > now.getTime())
        ? "waiting-scheduled"
        : "pending";
    }
  }

  const errorStage: DeviceProgress["errorStage"] = stage2 === "failed" ? "delivery" : null;

  let result: DeviceResult;
  if (stage2 === "failed") {
    result = "error";
  } else if (stage2 === "blocked-offline" || stage2 === "expired") {
    result = "warning";
  } else if (stage3 === "confirmed") {
    result = "success";
  } else {
    result = "processing";
  }

  return { deviceId, deviceName, stage2, stage3, result, errorStage };
}

/** Retry is only offered for states retrying can actually fix. A "failed" ack can be resent;
 * an offline device may come back and pick the reset target up on its next poll. An "expired"
 * target cannot be fixed by retry alone — the schedule window has to move first — so it is
 * deliberately excluded here even though the backend RPC would technically reset it. */
export function canRetryTarget(progress: DeviceProgress): boolean {
  return progress.stage2 === "failed" || progress.stage2 === "blocked-offline";
}

export function buildDeliveryRows(
  targets: PublicationDeliveryTarget[],
  schedule: PublicationSchedule | null | undefined,
  now: Date,
  playbackWindow?: PublicationPlaybackWindow | null
): DeliveryRow[] {
  return targets.map((target) => ({
    target,
    progress: deriveDeviceProgress(target, schedule, now, playbackWindow),
  }));
}

export function filterDeliveryRows(
  rows: DeliveryRow[],
  query: string,
  resultFilter: DeviceResult | "all"
): DeliveryRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter(({ target, progress }) => {
    if (resultFilter !== "all" && progress.result !== resultFilter) return false;
    if (q && !target.device_name?.toLowerCase().includes(q) && !target.device_id.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

function latestTargetActivity(targets: PublicationDeliveryTarget[]): string | null {
  let latest: number | null = null;
  for (const t of targets) {
    for (const ts of [t.updated_at, t.acked_at]) {
      if (!ts) continue;
      const ms = new Date(ts).getTime();
      if (latest === null || ms > latest) latest = ms;
    }
  }
  return latest === null ? null : new Date(latest).toISOString();
}

export function summarizeDelivery(
  targets: PublicationDeliveryTarget[],
  publication: {
    status?: string;
    activated_at?: string | null;
    cancelled_at?: string | null;
    playback_window?: PublicationPlaybackWindow | null;
  },
  schedule: PublicationSchedule | null | undefined,
  now: Date
): DeliverySummary {
  const total = targets.length;
  const stage2Done = targets.filter((t) => t.status === "delivered" || t.status === "playing").length;
  const stage3Done = targets.filter((t) => t.status === "playing").length;
  const overallPercent = total === 0 ? 0 : Math.floor((stage3Done / total) * 100);

  const connected = targets.filter((t) => t.status_level !== "offline").length;
  const delivered = stage2Done;
  const downloading = targets.filter((t) => t.status === "downloading").length;
  const offline = targets.filter((t) => isOffline(t)).length;
  const failed = targets.filter((t) => t.status === "failed").length;

  let result: PublishResult;
  if (publication.status === "cancelled") {
    result = "Cancelled";
  } else if (total === 0) {
    result = "Publish Failed";
  } else {
    const hasOutstanding = targets.some((t) => t.status !== "playing" && t.status !== "failed");
    const window = publication.playback_window;
    const settleAnchor = window?.state === "open" && window.opened_at
      ? new Date(window.opened_at).getTime()
      : publication.activated_at
        ? new Date(publication.activated_at).getTime()
        : null;
    const isWaitingForWindow = window?.state === "before" || window?.state === "between";
    const hasEnded = window?.state === "ended";
    const withinSettleWindow =
      !hasEnded && (settleAnchor === null || now.getTime() - settleAnchor < SETTLE_WINDOW_MS);

    if ((isWaitingForWindow && stage3Done < total) || (hasOutstanding && withinSettleWindow)) {
      result = "Publishing";
    } else if (stage3Done === total) {
      result = "Published Successfully";
    } else if (stage3Done === 0) {
      result = "Publish Failed";
    } else {
      result = "Completed with Warnings";
    }
  }

  const completedAt =
    result === "Publishing"
      ? null
      : result === "Cancelled"
        ? (publication.cancelled_at ?? null)
        : latestTargetActivity(targets);

  return {
    total,
    stage2Done,
    stage3Done,
    overallPercent,
    connected,
    delivered,
    downloading,
    offline,
    failed,
    result,
    completedAt,
  };
}

export const FAST_DELIVERY_POLL_MS = 10_000;
export const SLOW_DELIVERY_POLL_MS = 60_000;

/** Keep late reports visible without polling a future/weekly schedule every ten seconds. */
export function deliveryPollIntervalMs(
  targets: PublicationDeliveryTarget[],
  publication: {
    status?: string;
    effective_status?: string;
    playback_window?: PublicationPlaybackWindow | null;
  },
  summary: DeliverySummary
): number | null {
  if (
    publication.status === "cancelled" ||
    publication.status === "ended" ||
    publication.effective_status === "ended" ||
    publication.playback_window?.state === "ended"
  ) {
    return null;
  }

  const hasUnresolved = targets.some((target) =>
    target.status !== "playing" && target.status !== "failed"
  );
  if (!hasUnresolved) return null;

  const windowState = publication.playback_window?.state;
  if (windowState === "before" || windowState === "between") {
    return SLOW_DELIVERY_POLL_MS;
  }
  return summary.result === "Publishing" ? FAST_DELIVERY_POLL_MS : SLOW_DELIVERY_POLL_MS;
}
