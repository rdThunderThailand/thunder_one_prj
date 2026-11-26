/** Run: node src/features/asset-workspace/services/asset-label-preparation.check.mts */
import assert from "node:assert/strict";
import { prepareAssetLabels, startLabelTasks, type LabelPreparationStep } from "./asset-label-preparation.ts";

const asset = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "จอภาพ", assetTag: "AST-000001", status: "Available" };
const labels = [{ ...asset, qrValue: "https://app.example/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/assets/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }];

for (const firstStep of ["tools", "data"] as const) {
  const tools = Promise.withResolvers<void>();
  const data = Promise.withResolvers<typeof labels>();
  const completed: LabelPreparationStep[] = [];
  const started: string[] = [];
  let returned = false;
  const preparation = prepareAssetLabels("context", [asset], new AbortController().signal, (step) => completed.push(step), {
    loadTools: async () => { started.push("tools"); await tools.promise; },
    loadLabels: async () => { started.push("data"); return data.promise; },
  }).then((result) => { returned = true; return result; });
  assert.deepEqual(started, ["tools", "data"], "independent tasks start together");
  assert.deepEqual(completed, [], "starting work never advances the percentage");
  if (firstStep === "tools") tools.resolve(); else data.resolve(labels);
  // Flush the actual promise completion; no timer simulates progress.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(completed, [firstStep]);
  assert.equal(returned, false, "no partial preparation result is exposed");
  if (firstStep === "tools") data.resolve(labels); else tools.resolve();
  assert.deepEqual(await preparation, labels);
  assert.deepEqual(new Set(completed), new Set(["tools", "data"]));
  assert.equal(completed.length, 2, "each finished task reports once");
}

const controller = new AbortController();
const delayedTools = Promise.withResolvers<void>();
const delayedData = Promise.withResolvers<typeof labels>();
const cancelledSteps: LabelPreparationStep[] = [];
const cancelled = prepareAssetLabels("context", [asset], controller.signal, (step) => cancelledSteps.push(step), {
  loadTools: () => delayedTools.promise,
  loadLabels: () => delayedData.promise,
});
controller.abort();
delayedTools.resolve();
delayedData.resolve(labels);
await assert.rejects(cancelled, (error) => error instanceof DOMException && error.name === "AbortError");
assert.deepEqual(cancelledSteps, [], "cancelled work cannot advance the UI");

const failedSteps: LabelPreparationStep[] = [];
const denied = new Error("Permission denied");
await assert.rejects(() => prepareAssetLabels("context", [asset], new AbortController().signal, (step) => failedSteps.push(step), {
  loadTools: async () => {},
  loadLabels: async () => { throw denied; },
}), (error) => error === denied);
assert.equal(failedSteps.includes("data"), false, "failed requests never count as completed data");
// An early start by id: a good answer is used once the asset is known, with the asset's serial; anything else asks again.
for (const early of ["good", "failed", "other asset"] as const) {
  const asked: string[] = [];
  const tasks = startLabelTasks("context", asset.id, new AbortController().signal, {
    loadTools: async () => {},
    loadLabels: async (_context, scope) => {
      asked.push(scope[0].name);
      if (early === "failed" && asked.length === 1) throw denied;
      return labels;
    },
  }, async () => { throw new Error("tools failed to load early"); });
  assert.deepEqual(asked, [""], "the label is asked for before the asset is known");
  const scope = [{ ...asset, id: early === "other asset" ? "cccccccc-cccc-4ccc-8ccc-cccccccccccc" : asset.id, serialNumber: "SN-1" }];
  const result = await prepareAssetLabels("context", scope, new AbortController().signal, () => {}, tasks);
  assert.deepEqual(asked, early === "good" ? [""] : ["", asset.name]);
  if (early === "good") assert.equal(result[0].serialNumber, "SN-1");
}
const left = new AbortController();
const slow = Promise.withResolvers<typeof labels>();
const leaving = prepareAssetLabels("context", [asset], left.signal, () => {},
  startLabelTasks("context", asset.id, left.signal, { loadTools: async () => {}, loadLabels: () => slow.promise }, async () => {}));
left.abort();
slow.resolve(labels);
await assert.rejects(leaving, (error) => error instanceof DOMException && error.name === "AbortError");
console.log("Label preparation: parallel tasks, completion-only progress, both completion orders, failure and cancellation passed without network calls.");
