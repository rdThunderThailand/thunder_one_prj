import assert from "node:assert/strict";
import {
  createSaveSlot,
  ensureSavedWith,
  failureKind,
  initialLifecycle,
  lifecycleStatus,
  reduceLifecycle,
  savedBaseline,
} from "./editor-lifecycle.ts";

const at = new Date("2026-11-25T10:00:00Z");
const x = JSON.stringify({ name: "x" });
const y = JSON.stringify({ name: "y" });
const z = JSON.stringify({ name: "z" });

// 1. load = saved
const loaded = initialLifecycle(x);
assert.equal(lifecycleStatus(loaded, x, true), "saved");

// 2. an edit is dirty; editing back is clean again
assert.equal(lifecycleStatus(loaded, y, true), "dirty");
assert.equal(lifecycleStatus(loaded, x, true), "saved");

// 3. a successful save moves the baseline to the start snapshot
const saving = reduceLifecycle(loaded, { type: "save-start" });
assert.equal(saving.isSaving, true);
const saved = reduceLifecycle(saving, { type: "save-success", baseline: y, at });
assert.equal(saved.isSaving, false);
assert.equal(saved.lastSavedAt, at);
assert.equal(lifecycleStatus(saved, y, true), "saved");

// 4. an edit made during the save stays dirty
assert.equal(lifecycleStatus(saved, z, true), "dirty");

// 5. a failed save keeps the baseline and sets the error
const failed = reduceLifecycle(saving, { type: "save-failure", kind: "error", message: "boom" });
assert.equal(failed.baseline, x);
assert.equal(failed.saveError, "boom");
assert.equal(failed.conflict, null);
assert.equal(failed.isSaving, false);

// 6. a conflict sets `conflict`, not `saveError`
const conflicted = reduceLifecycle(saving, { type: "save-failure", kind: "conflict", message: "changed elsewhere" });
assert.equal(conflicted.conflict, "changed elsewhere");
assert.equal(conflicted.saveError, null);
assert.equal(conflicted.baseline, x);

// 7. a reload clears the conflict and resets the baseline
const reloaded = reduceLifecycle(conflicted, { type: "reset", baseline: JSON.stringify({ name: "w" }) });
assert.equal(reloaded.conflict, null);
assert.equal(reloaded.baseline, JSON.stringify({ name: "w" }));
// a failed reload (error) keeps the conflict so Reload stays available; `clear-error` leaves the conflict too
const reloadFailed = reduceLifecycle(conflicted, { type: "save-failure", kind: "error", message: "reload failed" });
assert.equal(reloadFailed.conflict, "changed elsewhere");
assert.equal(reloadFailed.saveError, "reload failed");
assert.equal(reduceLifecycle(reloadFailed, { type: "clear-error" }).saveError, null);
assert.equal(reduceLifecycle(reloadFailed, { type: "clear-error" }).conflict, "changed elsewhere");
assert.equal(reduceLifecycle(failed, { type: "clear-error" }).saveError, null);
// a new save also clears the previous error and conflict
assert.equal(reduceLifecycle(failed, { type: "save-start" }).saveError, null);
assert.equal(reduceLifecycle(conflicted, { type: "save-start" }).conflict, null);

// 8. ensureSaved: clean writes nothing and is true; a failed save is false
let writes = 0;
assert.equal(await ensureSavedWith(false, async () => { writes += 1; return "id"; }), true);
assert.equal(writes, 0);
assert.equal(await ensureSavedWith(true, async () => { writes += 1; return "id"; }), true);
assert.equal(writes, 1);
assert.equal(await ensureSavedWith(true, async () => null), false);

// 9. no row, never saved, untouched = new; a first save makes it saved
const fresh = initialLifecycle(x);
assert.equal(lifecycleStatus(fresh, x, false), "new");
assert.equal(lifecycleStatus(reduceLifecycle(fresh, { type: "save-success", baseline: x, at }), x, false), "saved");

// 10. the save slot: two calls in flight run once; it frees after settling and after a rejection
let runs = 0;
let release: (value: string) => void = () => {};
const slot = createSaveSlot((label: string) => {
  runs += 1;
  return new Promise<string>((resolve) => { release = (value) => resolve(`${label}:${value}`); });
});
const first = slot("a");
const second = slot("b");
assert.equal(runs, 1);
release("done");
assert.equal(await first, "a:done");
assert.equal(await second, "a:done");
const third = slot("c");
assert.equal(runs, 2);
release("again");
assert.equal(await third, "c:again");
let attempts = 0;
const flaky = createSaveSlot(async () => {
  attempts += 1;
  if (attempts === 1) throw new Error("first fails");
  return "ok";
});
await assert.rejects(flaky(), /first fails/);
assert.equal(await flaky(), "ok");

// 11. a conflict needs a reload to be a conflict
assert.equal(failureKind("conflict", false), "error");
assert.equal(failureKind("conflict", true), "conflict");
assert.equal(failureKind("rejected", true), "error");

// 12. the saved baseline is the start snapshot, or what `savedSnapshot` makes of it
const start = { name: "a", layoutId: null as string | null };
assert.equal(savedBaseline(start, { layoutId: "L1" }), JSON.stringify(start));
assert.equal(
  savedBaseline(start, { layoutId: "L1" }, (s, r) => ({ ...s, layoutId: r.layoutId })),
  JSON.stringify({ name: "a", layoutId: "L1" }),
);

console.log("editor-lifecycle.check: ok");
