/** Run: node src/features/asset-workspace/services/asset-import-confirm.check.mts */
import assert from "node:assert/strict";
import type { ConfirmResult, ImportBatch, ImportConfirmBody } from "../domain/asset-import-types.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { confirmImportBatch, waitForImportRetry } from "./asset-import-confirm.ts";
import { createHttpImportApi, type ImportHttpResponse } from "./asset-import-http.ts";

const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const batchId = "33333333-3333-4333-8333-333333333333";
const base: ImportBatch = {
  id: batchId, batchCode: "IMP-20261104-0001", status: "validated", totalRows: 5000,
  counts: { valid: 4800, warning: 100, error: 100, created: 0, createdWithWarning: 0, notRegistered: 0, pending: 0 },
  createdAt: "2026-11-04T00:00:00Z", createdBy: { id: userId, name: "Manager" }, sourceFile: null,
  original: null, registeredAssetsPath: `/assets/list?import_batch_id=${batchId}`,
};
const body = { mode: "ready_and_warnings", override_reason: "Replacement units" } as const;
const success = (data: unknown): ImportHttpResponse => ({ status: 200, data: { success: true, data } });
const failure = (status: number, code: string): ImportHttpResponse => ({ status, data: { error: { code, message: "Diagnostic" } } });
type Scenario = {
  lostBefore?: number;
  lostAfter?: number;
  lostFinalRead?: boolean;
  finalReadFailure?: boolean;
  finalStillProcessing?: boolean;
  postFailure?: ImportHttpResponse;
  mutate?: (result: ConfirmResult) => unknown;
};

// This in-memory HTTP transport is a check fixture only; no application imports it.
function setup(scenario: Scenario = {}, initialProcessed = 0) {
  let processed = initialProcessed;
  let reads = 0;
  let finalReads = 0;
  let posts = 0;
  const bodies: string[] = [];
  const waits: number[] = [];
  const snapshots: { processed: number; retrying: boolean; status: string }[] = [];
  function current(): ImportBatch {
    const created = Math.min(processed, 4800);
    const createdWithWarning = Math.min(Math.max(processed - 4800, 0), 100);
    const notRegistered = Math.max(processed - 4900, 0);
    return { ...base, status: processed === 5000 ? "partially_completed" : processed ? "processing" : "validated",
      counts: { ...base.counts, created, createdWithWarning, notRegistered, pending: processed ? 5000 - processed : 0 } };
  }
  const api = createHttpImportApi({ tenantId, userId }, async (request) => {
    assert.equal(request.headers["x-registration-context"], `${tenantId}:${userId}`);
    assert.ok(request.url.startsWith("/api/proxy/v2/asset-workspace/assets/imports/"));
    if (request.method === "POST") {
      assert.ok(request.url.endsWith("/confirm"));
      posts += 1;
      bodies.push(JSON.stringify(request.data));
      if (scenario.postFailure) return scenario.postFailure;
      if (posts <= (scenario.lostBefore ?? 0)) throw new Error("Network unavailable before commit");
      const perCall = Math.min(100, 5000 - processed);
      processed += perCall;
      if (posts === scenario.lostAfter) throw new Error("Committed, but the response was lost");
      const batch = current();
      const result: ConfirmResult = { batchId, status: batch.status, processed: perCall, remaining: 5000 - processed,
        counts: { created: batch.counts.created, createdWithWarning: batch.counts.createdWithWarning, notRegistered: batch.counts.notRegistered } };
      return success(scenario.mutate ? scenario.mutate(result) : result);
    }
    assert.equal(request.method, "GET");
    reads += 1;
    if (processed === 5000) {
      finalReads += 1;
      if (scenario.lostFinalRead && finalReads === 1) throw new Error("Final read response lost");
      if (scenario.finalReadFailure) return failure(500, "INTERNAL");
      if (scenario.finalStillProcessing) return success({ ...current(), status: "processing" });
    }
    return success(current());
  });
  const run = (input: ImportConfirmBody | undefined = body, signal = new AbortController().signal) =>
    confirmImportBatch(api, current(), input, signal, (state) => snapshots.push({
      processed: state.progress.value / 100 * 5000, retrying: state.retrying, status: state.batch.status,
    }), async (milliseconds, retrySignal) => { retrySignal.throwIfAborted(); waits.push(milliseconds); });
  return { api, run, bodies, waits, snapshots, current, stats: () => ({ processed, reads, finalReads, posts }) };
}

const rejectsCode = (operation: () => Promise<unknown>, code: string) =>
  assert.rejects(operation, (error) => error instanceof ImportApiError && error.code === code);
const sameBodies = (test: ReturnType<typeof setup>, expected: ImportConfirmBody) =>
  assert.ok(test.bodies.length && test.bodies.every((value) => value === JSON.stringify(expected)), "every POST, including retry, keeps exactly the original body");

const normal = setup();
const completed = await normal.run();
assert.equal(completed.status, "partially_completed");
assert.deepEqual(normal.stats(), { processed: 5000, reads: 1, finalReads: 1, posts: 50 });
sameBodies(normal, body);
assert.equal(normal.snapshots.at(-1)?.processed, 5000);
assert.equal(normal.snapshots[1].processed, 100);
assert.equal(normal.snapshots[49].processed, 4900, "progress uses remaining, not a cumulative sum of per-call processed");

for (const scenario of [{ lostBefore: 1 }, { lostAfter: 1 }, { lostAfter: 25 }, { lostAfter: 50 }, { lostFinalRead: true }]) {
  const test = setup(scenario);
  assert.equal((await test.run()).status, "partially_completed");
  sameBodies(test, body);
  assert.equal(test.stats().processed, 5000);
  assert.ok(test.snapshots.some((value) => value.retrying));
  assert.ok(test.stats().reads >= 2 || scenario.lostAfter === 50);
  assert.deepEqual(test.waits, [1000]);
}
const backoff = setup({ lostBefore: 8 });
await backoff.run();
sameBodies(backoff, body);
assert.deepEqual(backoff.waits, [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
const resumed = setup({}, 2300);
await resumed.run({});
sameBodies(resumed, {});
assert.equal(resumed.stats().posts, 27);
assert.equal(resumed.snapshots[0].processed, 2300);

for (const [status, code] of [[400, "VALIDATION"], [401, "UNAUTHENTICATED"], [403, "PERMISSION_DENIED"],
  [404, "NOT_FOUND"], [409, "INVALID_STATE"], [500, "INTERNAL"], [503, "IMPORT_UNAVAILABLE"]] as const) {
  const test = setup({ postFailure: failure(status, code) }, 200);
  await rejectsCode(() => test.run(), code);
  assert.equal(test.stats().posts, 1);
  assert.equal(test.waits.length, 0);
  assert.equal(test.snapshots.at(-1)?.processed, 200, "failed calls preserve verified progress");
  assert.equal(test.snapshots.some((state) => state.status === "partially_completed"), false);
}
const missingRoute = setup({ postFailure: { status: 404, data: "<html>Not Found</html>" } });
await rejectsCode(() => missingRoute.run(), "CONFIRM_UNAVAILABLE");
const manual = setup({ postFailure: failure(500, "INTERNAL") });
await rejectsCode(() => manual.run(), "INTERNAL");
await rejectsCode(() => manual.run(), "INTERNAL");
sameBodies(manual, body);

for (const mutate of [
  (value: ConfirmResult) => ({ ...value, batchId: tenantId }),
  (value: ConfirmResult) => ({ ...value, status: "validated" }),
  (value: ConfirmResult) => ({ ...value, remaining: 0 }),
  (value: ConfirmResult) => ({ ...value, counts: { ...value.counts, created: value.counts.created + 1 } }),
  (value: ConfirmResult) => ({ ...value, remaining: 5000, counts: { created: 0, createdWithWarning: 0, notRegistered: 0 } }),
]) {
  const test = setup({ mutate });
  await rejectsCode(() => test.run(), "INVALID_RESPONSE");
  assert.equal(test.stats().posts, 1);
  assert.equal(test.snapshots.some((state) => state.status === "partially_completed"), false);
}
for (const scenario of [{ finalReadFailure: true }, { finalStillProcessing: true }]) {
  const test = setup(scenario);
  await rejectsCode(() => test.run(), scenario.finalReadFailure ? "INTERNAL" : "INVALID_RESPONSE");
  assert.equal(test.snapshots.at(-1)?.status, "processing", "P4 must wait for a verified terminal batch");
  assert.equal(test.snapshots.at(-1)?.processed, 4900);
}
const invalid = setup();
for (const payload of [{ override_reason: " " }, { override_reason: "x".repeat(1001) }, { unknown: true }]) {
  await rejectsCode(() => invalid.api.confirm(batchId, payload as ImportConfirmBody), "VALIDATION");
}
assert.equal(invalid.stats().posts, 0);
const stopped = new AbortController();
stopped.abort(new Error("Stopped"));
await assert.rejects(() => invalid.run(body, stopped.signal), /Stopped/);
assert.equal(invalid.stats().posts, 0);
const cancelled = new AbortController();
const delay = waitForImportRetry(30000, cancelled.signal);
cancelled.abort(new Error("Stopped waiting"));
await assert.rejects(delay, /Stopped waiting/);
const finishedApi = setup({}, 5000);
await finishedApi.run();
assert.equal(finishedApi.stats().posts, 0);
console.log("asset-import-confirm.check.mts: 50-call loop, unchanged bodies, lost responses, backoff, resume, failures and verified completion passed");
