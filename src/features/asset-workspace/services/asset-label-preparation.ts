import type { AssetLabel, LabelCandidate } from "../domain/asset-labels.ts";
import { getAssetLabels } from "./asset-labels-api.ts";

export type LabelPreparationStep = "tools" | "data";
type PreparationTasks = {
  loadTools: (asset: LabelCandidate, signal: AbortSignal) => Promise<void>;
  loadLabels: (context: string, scope: readonly LabelCandidate[], signal: AbortSignal) => Promise<AssetLabel[]>;
};

async function loadLabelTools(asset: LabelCandidate, signal: AbortSignal) {
  const [{ loadAssetLabelFonts }] = await Promise.all([
    import("./asset-label-text.ts"), import("jsbarcode"), import("qrcode"),
  ]);
  signal.throwIfAborted();
  await loadAssetLabelFonts(asset);
  signal.throwIfAborted();
}

const preparationTasks: PreparationTasks = { loadTools: loadLabelTools, loadLabels: getAssetLabels };

/** Count completed work, never elapsed time. Both tasks must succeed before any preview is exposed. */
export async function prepareAssetLabels(context: string, scope: readonly LabelCandidate[], signal: AbortSignal,
  onStep: (step: LabelPreparationStep) => void, tasks: PreparationTasks = preparationTasks) {
  signal.throwIfAborted();
  const tools = tasks.loadTools(scope[0], signal).then(() => {
    signal.throwIfAborted();
    onStep("tools");
  });
  const data = tasks.loadLabels(context, scope, signal).then((labels) => {
    signal.throwIfAborted();
    onStep("data");
    return labels;
  });
  const [labels] = await Promise.all([data, tools]);
  signal.throwIfAborted();
  return labels;
}
