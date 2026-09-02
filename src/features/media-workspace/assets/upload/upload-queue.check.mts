/**
 * Runnable check for the queue state machine and two-worker scheduler:
 *
 *     node src/features/media-workspace/assets/upload/upload-queue.check.mts
 */
import assert from "node:assert/strict";
import {
  aggregateAction,
  nextToStart,
  reservationToRelease,
  retryPlan,
  stageFiles,
  summarize,
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
  state,
  pct: 0,
});

// --- stageFiles ---

{
  const { items, rejections } = stageFiles([], [{ id: "1", file: file("a.mp4") }]);
  assert.equal(items.length, 1, "accepted file stages");
  assert.equal(items[0].state, "staged");
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
  const ten = Array.from({ length: 10 }, (_, i) => item(String(i), "staged"));
  const { items, rejections } = stageFiles(ten, [{ id: "11", file: file("eleventh.mp4") }]);
  assert.equal(items.length, 10, "11th file does not enter the queue");
  assert.ok(rejections[0]?.includes("คิวเต็มแล้ว"));
}

// --- aggregateAction ---

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

{
  const twoWaiting = [item("1", "waiting"), item("2", "waiting")];
  assert.deepEqual(nextToStart(twoWaiting), ["1", "2"], "empty queue starts up to two workers");
}

{
  const oneActive = [item("1", "uploading"), item("2", "waiting"), item("3", "waiting")];
  assert.deepEqual(nextToStart(oneActive), ["2"], "one active leaves one free slot");
}

{
  const fullyActive = [item("1", "uploading"), item("2", "uploading"), item("3", "waiting")];
  assert.deepEqual(nextToStart(fullyActive), [], "two active leaves no free slot");
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

console.log("upload-queue: all checks passed");
