/**
 * Runnable check for publication delivery progress (ADR 0021):
 *
 *     node src/features/publications/delivery-progress.check.mts
 */
import assert from "node:assert/strict";
import {
  deriveDeviceProgress,
  summarizeDelivery,
  filterDeliveryRows,
  buildDeliveryRows,
  canRetryTarget,
  deliveryPollIntervalMs,
  FAST_DELIVERY_POLL_MS,
  SLOW_DELIVERY_POLL_MS,
} from "./delivery-progress.ts";
import type {
  PublicationDeliveryTarget,
  PublicationPlaybackWindow,
  PublicationSchedule,
} from "./types/index.ts";

const now = new Date("2026-08-18T10:00:00Z");

function playbackWindow(
  overrides: Partial<PublicationPlaybackWindow>
): PublicationPlaybackWindow {
  return {
    state: "open",
    opened_at: "2026-08-18T09:55:00Z",
    closes_at: null,
    next_opens_at: null,
    ...overrides,
  };
}

function target(overrides: Partial<PublicationDeliveryTarget>): PublicationDeliveryTarget {
  return {
    device_id: "dev-1",
    device_name: "Central World 01",
    status: "pending",
    status_level: "online",
    ...overrides,
  };
}

// playing device confirms both delivery and playback stages, and counts as success.
{
  const t = target({ status: "playing" });
  const p = deriveDeviceProgress(t, null, now);
  assert.equal(p.stage2, "completed");
  assert.equal(p.stage3, "confirmed");
  assert.equal(p.result, "success");
  assert.equal(p.errorStage, null);
}

// delivered with a future schedule start waits — it is not an error.
{
  const t = target({ status: "delivered" });
  const schedule: PublicationSchedule = {
    starts_at: "2026-08-18T12:00:00Z",
    ends_at: null,
    timezone: "Asia/Bangkok",
    recurrence: {},
  };
  const p = deriveDeviceProgress(t, schedule, now);
  assert.equal(p.stage3, "waiting-scheduled");
  assert.equal(p.result, "processing");
}

// delivered with no future schedule is just pending playback, not an error.
{
  const t = target({ status: "delivered" });
  const p = deriveDeviceProgress(t, null, now);
  assert.equal(p.stage3, "pending");
  assert.equal(p.result, "processing");
}

// pending + offline is a warning, not an error — the device simply isn't there.
{
  const t = target({ status: "pending", status_level: "offline" });
  const p = deriveDeviceProgress(t, null, now);
  assert.equal(p.stage2, "blocked-offline");
  assert.equal(p.result, "warning");
  assert.equal(p.errorStage, null);
  assert.equal(canRetryTarget(p), true);
}

// pending + ONLINE with a schedule whose window already closed is stuck forever, not "queued" —
// media_job_poll never hands out a job past ends_at, online device or not. Not retryable either:
// resetting to pending won't fix an expired window.
{
  const t = target({ status: "pending", status_level: "online" });
  const schedule: PublicationSchedule = {
    starts_at: "2026-08-17T10:13:00Z",
    ends_at: "2026-08-17T16:59:00Z",
    timezone: "Asia/Bangkok",
    recurrence: {},
  };
  const p = deriveDeviceProgress(t, schedule, now);
  assert.equal(p.stage2, "expired");
  assert.equal(p.result, "warning");
  assert.equal(canRetryTarget(p), false);
}

// downloading past the schedule window is also expired, not "in-progress".
{
  const t = target({ status: "downloading", status_level: "online" });
  const schedule: PublicationSchedule = {
    starts_at: "2026-08-17T10:13:00Z",
    ends_at: "2026-08-17T16:59:00Z",
    timezone: "Asia/Bangkok",
    recurrence: {},
  };
  const p = deriveDeviceProgress(t, schedule, now);
  assert.equal(p.stage2, "expired");
}

// a failed target is retryable.
{
  const t = target({ status: "failed" });
  const p = deriveDeviceProgress(t, null, now);
  assert.equal(canRetryTarget(p), true);
}

// failed target is an error, attributed to the delivery stage.
{
  const t = target({ status: "failed" });
  const p = deriveDeviceProgress(t, null, now);
  assert.equal(p.stage2, "failed");
  assert.equal(p.stage3, "not-reached");
  assert.equal(p.result, "error");
  assert.equal(p.errorStage, "delivery");
}

// overall percent never reaches 100 while any target isn't playing.
{
  const targets = [target({ status: "playing" }), target({ status: "delivered", device_id: "dev-2" })];
  const summary = summarizeDelivery(targets, { status: "active" }, null, now);
  assert.equal(summary.overallPercent, 50);
  assert.ok(summary.overallPercent < 100);
}

// within the settle window, outstanding targets keep the result "Publishing".
{
  const targets = [target({ status: "pending" })];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:58:00Z" },
    null,
    now
  );
  assert.equal(summary.result, "Publishing");
}

// A future or between-recurrence window must not fail before playback is expected.
{
  const targets = [target({ status: "delivered" })];
  for (const state of ["before", "between"] as const) {
    const summary = summarizeDelivery(
      targets,
      {
        status: "active",
        activated_at: "2026-08-18T01:00:00Z",
        playback_window: playbackWindow({ state, opened_at: null }),
      },
      null,
      now
    );
    assert.equal(summary.result, "Publishing");

    const failedSummary = summarizeDelivery(
      [target({ status: "failed" })],
      {
        status: "active",
        playback_window: playbackWindow({ state, opened_at: null }),
      },
      null,
      now
    );
    assert.equal(failedSummary.result, "Publishing");
  }
}

// Once a weekly window opens, its own opened_at is the settle anchor, not an old activation.
{
  const targets = [target({ status: "delivered" })];
  const summary = summarizeDelivery(
    targets,
    {
      status: "active",
      activated_at: "2026-08-01T01:00:00Z",
      playback_window: playbackWindow({ opened_at: "2026-08-18T09:55:00Z" }),
    },
    null,
    now
  );
  assert.equal(summary.result, "Publishing");
}

// An ended schedule settles from target outcomes even when the total schedule was shorter than
// the normal settle window.
{
  const targets = [target({ status: "delivered" })];
  const summary = summarizeDelivery(
    targets,
    {
      status: "active",
      activated_at: "2026-08-18T09:55:00Z",
      playback_window: playbackWindow({ state: "ended", opened_at: null }),
    },
    null,
    now
  );
  assert.equal(summary.result, "Publish Failed");
}

// past the settle window, an offline/pending target stops blocking and the run settles with warnings.
{
  const targets = [target({ status: "playing" }), target({ status: "pending", status_level: "offline", device_id: "dev-2" })];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:00:00Z" },
    null,
    now
  );
  assert.equal(summary.result, "Completed with Warnings");
}

// every target playing settles as fully successful.
{
  const targets = [target({ status: "playing" }), target({ status: "playing", device_id: "dev-2" })];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:00:00Z" },
    null,
    now
  );
  assert.equal(summary.result, "Published Successfully");
}

// no target ever playing settles as a hard failure.
{
  const targets = [target({ status: "failed" }), target({ status: "failed", device_id: "dev-2" })];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:00:00Z" },
    null,
    now
  );
  assert.equal(summary.result, "Publish Failed");
}

// a cancelled publication reports Cancelled regardless of target states.
{
  const targets = [target({ status: "pending" })];
  const summary = summarizeDelivery(targets, { status: "cancelled" }, null, now);
  assert.equal(summary.result, "Cancelled");
}

// completedAt is null while still Publishing.
{
  const targets = [target({ status: "pending" })];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:58:00Z" },
    null,
    now
  );
  assert.equal(summary.completedAt, null);
}

// completedAt for a settled result is the latest target activity, not "now".
{
  const targets = [
    target({ status: "playing", updated_at: "2026-08-18T09:30:00Z" }),
    target({ status: "playing", device_id: "dev-2", updated_at: "2026-08-18T09:45:00Z" }),
  ];
  const summary = summarizeDelivery(
    targets,
    { status: "active", activated_at: "2026-08-18T09:00:00Z" },
    null,
    now
  );
  assert.equal(summary.result, "Published Successfully");
  assert.equal(summary.completedAt, "2026-08-18T09:45:00.000Z");
}

// completedAt for Cancelled reads publications.cancelled_at, not target activity.
{
  const targets = [target({ status: "pending", updated_at: "2026-08-18T08:00:00Z" })];
  const summary = summarizeDelivery(
    targets,
    { status: "cancelled", cancelled_at: "2026-08-18T09:15:00Z" },
    null,
    now
  );
  assert.equal(summary.completedAt, "2026-08-18T09:15:00Z");
}

// search and result filters combine.
{
  const targets = [
    target({ device_id: "dev-1", device_name: "Central World 01", status: "playing" }),
    target({ device_id: "dev-2", device_name: "Siam Center 01", status: "failed" }),
  ];
  const rows = buildDeliveryRows(targets, null, now);
  const bySearch = filterDeliveryRows(rows, "siam", "all");
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].target.device_id, "dev-2");

  const byResult = filterDeliveryRows(rows, "", "error");
  assert.equal(byResult.length, 1);
  assert.equal(byResult[0].target.device_id, "dev-2");
}

// Poll fast while an open run is settling, slow while waiting/late, and stop at terminals.
{
  const targets = [target({ status: "delivered" })];
  const fastPublication = {
    status: "active",
    playback_window: playbackWindow({}),
  };
  const fastSummary = summarizeDelivery(
    targets,
    { ...fastPublication, activated_at: "2026-08-18T09:55:00Z" },
    null,
    now
  );
  assert.equal(
    deliveryPollIntervalMs(targets, fastPublication, fastSummary),
    FAST_DELIVERY_POLL_MS
  );

  const waitingPublication = {
    status: "active",
    playback_window: playbackWindow({ state: "between", opened_at: null }),
  };
  assert.equal(
    deliveryPollIntervalMs(targets, waitingPublication, fastSummary),
    SLOW_DELIVERY_POLL_MS
  );

  assert.equal(
    deliveryPollIntervalMs(
      [target({ status: "playing" })],
      fastPublication,
      fastSummary
    ),
    null
  );

  assert.equal(
    deliveryPollIntervalMs(
      [target({ status: "pending" })],
      { status: "active", effective_status: "ended" },
      fastSummary
    ),
    null
  );
}

console.log("delivery-progress.check.mts: all checks passed");
