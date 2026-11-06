/** Run: node src/features/asset-workspace/services/asset-label-preparation.check.mts */
import assert from "node:assert/strict";
import { prepareAssetLabels, type LabelPreparationStep } from "./asset-label-preparation.ts";

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
console.log("Label preparation: parallel tasks, completion-only progress, both completion orders, failure and cancellation passed without network calls.");
