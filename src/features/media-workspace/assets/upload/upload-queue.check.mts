/**
 * Runnable check for the queue state machine and worker scheduler:
 *
 *     node src/features/media-workspace/assets/upload/upload-queue.check.mts
 */
import assert from "node:assert/strict";
import {
  MAX_WORKERS,
  aggregateAction,
  nextToStart,
  reservationToRelease,
  retryPlan,
  startItems,
  stageFiles,
  summarize,
  settleConverting,
  uploadOutcome,
  type UploadItem,
} from "./upload-queue.ts";
import type { UploadTarget } from "../../publications/services/upload-api.ts";

const file = (name: string, size = 1024) => ({
  name,
  type: name.endsWith(".pdf") ? "application/pdf" : "video/mp4",
  size,
});
const item = (id: string, state: UploadItem["state"], name = `${id}.mp4`): UploadItem => ({
  id,
  file: file(name),
  title: name,
  state,
  pct: 0,
});

// --- stageFiles ---

{
  const { items, rejections } = stageFiles([], [{ id: "1", file: file("a.mp4") }]);
  assert.equal(items.length, 1, "accepted file stages");
  assert.equal(items[0].state, "staged");
  assert.equal(items[0].title, "a.mp4", "display name starts from the original filename");
  assert.equal(rejections.length, 0);
}

{
  const { rejections } = stageFiles([], [{ id: "1", file: file("a.pdf") }]);
  assert.equal(rejections.length, 1, "unsupported type is rejected");
}

{
  const { rejections } = stageFiles([], [{ id: "1", file: file("a.mp4", 6 * 1024 ** 3) }]);
  assert.ok(rejections[0]?.includes("5 GB"), "oversized file is rejected");
}

{
  const staged = stageFiles([], [{ id: "1", file: file("a.mp4") }]).items;
  const { items, rejections } = stageFiles(staged, [{ id: "2", file: file("a.mp4") }]);
  assert.equal(items.length, 1, "duplicate name+size is not added");
  assert.ok(rejections[0]?.includes("อยู่ในคิวแล้ว"));
}

{
  const hundred = Array.from({ length: 100 }, (_, i) => item(String(i), "staged"));
  const { items, rejections } = stageFiles(hundred, [{ id: "101", file: file("extra.mp4") }]);
  assert.equal(items.length, 101, "the queue has no artificial file-count ceiling");
  assert.equal(rejections.length, 0);
}

// --- aggregateAction ---

{
  const selected = ["tag-2", "tag-1", "tag-2"];
  const started = startItems([item("1", "staged"), item("2", "completed")], selected);
  selected.push("tag-3");
  assert.equal(started[0].state, "waiting", "staged rows start");
  assert.deepEqual(started[0].tagIds, ["tag-2", "tag-1"], "Tag selection is deduplicated and snapshotted");
  assert.equal(started[1].tagIds, undefined, "terminal rows keep their original settings");
}

assert.equal(aggregateAction([]), null, "empty queue has no aggregate action");
assert.equal(aggregateAction([item("1", "staged")]), "clear-queue");
assert.equal(aggregateAction([item("1", "waiting")]), "cancel-all");
assert.equal(aggregateAction([item("1", "uploading")]), "cancel-all");
assert.equal(
  aggregateAction([item("1", "staged"), item("2", "uploading")]),
  "cancel-all",
  "active work outranks staged rows"
);
assert.equal(aggregateAction([item("1", "completed"), item("2", "failed")]), "clear-all");

// --- nextToStart ---

assert.equal(MAX_WORKERS, 4, "ADR 0059 amendment 2026-11-04");

{
  const sixWaiting = Array.from({ length: 6 }, (_, i) => item(String(i + 1), "waiting"));
  assert.deepEqual(nextToStart(sixWaiting), ["1", "2", "3", "4"], "an empty queue starts four workers");
}

{
  const oneActive = [item("1", "uploading"), item("2", "waiting"), item("3", "waiting")];
  assert.deepEqual(nextToStart(oneActive), ["2", "3"], "a free slot starts the next waiting rows");
}

{
  const fullyActive = [...["1", "2", "3", "4"].map((id) => item(id, "uploading")), item("5", "waiting")];
  assert.deepEqual(nextToStart(fullyActive), [], "four active leaves no free slot");
}

{
  const afterCancel = [item("1", "canceled"), ...["2", "3", "4", "5"].map((id) => item(id, "uploading")), item("6", "waiting")];
  assert.deepEqual(nextToStart(afterCancel), [], "a canceled row never counts as a slot taken");
  const freed = [item("1", "canceled"), ...["2", "3", "4"].map((id) => item(id, "uploading")), item("5", "waiting")];
  assert.deepEqual(nextToStart(freed), ["5"], "canceling a preparing row frees its slot at once");
}

{
  const afterFailure = [item("1", "failed"), item("2", "uploading"), item("3", "waiting")];
  assert.deepEqual(nextToStart(afterFailure), ["3"], "a failed item frees its slot");
}

// --- summarize ---

{
  const mixed = [item("1", "staged"), item("2", "uploading"), item("3", "completed"), item("4", "failed")];
  const summary = summarize(mixed);
  assert.equal(summary.total, 4);
  assert.equal(summary.totalBytes, 4096);
  assert.equal(summary.staged, 1);
  assert.equal(summary.uploading, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 1);
}

// --- retryPlan / reservationToRelease ---

const target = { file_id: "f-1" } as UploadTarget;

{
  const plan = retryPlan({ ...item("1", "failed"), target });
  assert.equal(plan.shouldResume, true, "a live reservation is resumed, not re-authorized");
  assert.equal(plan.release, undefined, "resuming releases nothing");
}

{
  const plan = retryPlan({ ...item("1", "failed"), target, isReservationDead: true });
  assert.equal(plan.shouldResume, false, "an expired reservation forces a restart");
  assert.equal(plan.release, target, "the dead reservation is handed back for cancellation");
}

{
  const registration = { duration_seconds: 12 };
  const resume = retryPlan({ ...item("1", "failed"), target, registration });
  assert.equal(resume.registration, registration, "a finished transfer keeps its draft, so Retry only registers");
  const restart = retryPlan({ ...item("1", "failed"), target, registration, isReservationDead: true });
  assert.equal(restart.registration, undefined, "a restart uploads the bytes again, so the draft is dropped");
}

{
  const plan = retryPlan(item("1", "failed"));
  assert.equal(plan.shouldResume, false, "a file that never authorized restarts");
  assert.equal(plan.release, undefined, "nothing to release when nothing was reserved");
}

assert.equal(
  reservationToRelease({ ...item("1", "uploading"), target }),
  target,
  "cancelling mid-upload releases the reservation"
);
assert.equal(
  reservationToRelease({ ...item("1", "completed"), target }),
  undefined,
  "a registered file's reservation belongs to its Asset and is never cancelled"
);
assert.equal(
  reservationToRelease({ ...item("1", "failed"), target, isReservationDead: true }),
  target,
  "an expired Storage session still owns its files row, so dismissing it releases that row"
);
assert.equal(
  reservationToRelease({ ...item("1", "canceled"), isReservationDead: true }),
  undefined,
  "a cancel already dropped its target, so nothing is cancelled twice"
);

// --- uploadOutcome (ADR 0071: status -> queue-row outcome; the sentence comes from playback-readiness) ---

assert.deepEqual(
  uploadOutcome("failed", { code: "unsupported_profile", profile: "High" }),
  { state: "failed", readiness: "unsupported_profile" },
  "failed keeps the reason the verdict gives"
);
assert.deepEqual(
  uploadOutcome("failed", null),
  { state: "failed", readiness: "refused" },
  "a failed row with no verdict falls back to a generic refusal"
);
assert.deepEqual(
  uploadOutcome("processing", { code: "unsupported_profile", profile: "High" }),
  { state: "completed", readiness: "converting" },
  "processing is not a refusal, ADR 0071"
);
assert.deepEqual(
  uploadOutcome("ready", { code: "unverified_preset", profile: "Main" }),
  { state: "completed", readiness: "ready" },
  "Main is ready to publish; the upload is Completed either way"
);
assert.deepEqual(uploadOutcome("ready", null), { state: "completed", readiness: null }, "an image or unprobed video says nothing");

const converting = { id: "1", file: { name: "a.mp4", type: "video/mp4", size: 1 }, title: "a", state: "completed", pct: 100, readiness: "converting" } as const;
assert.equal(settleConverting(converting, "ready").readiness, "ready", "a Rendition landed");
assert.deepEqual(
  { state: settleConverting(converting, "failed").state, readiness: settleConverting(converting, "failed").readiness },
  { state: "failed", readiness: "unsupported_profile" },
  "the conversion gave up"
);
assert.equal(settleConverting(converting, "processing"), converting, "still converting");

console.log("upload-queue: all checks passed");
