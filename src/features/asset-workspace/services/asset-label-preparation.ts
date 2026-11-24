import type { AssetLabel, LabelCandidate } from "../domain/asset-labels.ts";
import { getAssetLabels } from "./asset-labels-api.ts";

export type LabelPreparationStep = "tools" | "data";
export type PreparationTasks = {
  loadTools: (asset: LabelCandidate, signal: AbortSignal) => Promise<void>;
  loadLabels: (context: string, scope: readonly LabelCandidate[], signal: AbortSignal) => Promise<AssetLabel[]>;
};

const importLabelTools = () => Promise.all([import("./asset-label-text.ts"), import("jsbarcode"), import("qrcode")]);

async function loadLabelTools(asset: LabelCandidate, signal: AbortSignal) {
  const [{ loadAssetLabelFonts }] = await importLabelTools();
  signal.throwIfAborted();
  await loadAssetLabelFonts(asset);
  signal.throwIfAborted();
}

const preparationTasks: PreparationTasks = { loadTools: loadLabelTools, loadLabels: getAssetLabels };

/**
 * Starts one asset's label by id, before its name, serial and status are known. Only a good answer is used: after a failed
 * start the label is asked for again with the full asset, so every message stays the same.
 */
export function startLabelTasks(context: string, id: string, signal: AbortSignal, tasks: PreparationTasks = preparationTasks,
  warmTools: () => Promise<unknown> = importLabelTools): PreparationTasks {
  void warmTools().catch(() => undefined);
  const started = tasks.loadLabels(context, [{ id, name: "", assetTag: id, status: "" }], signal).catch(() => null);
  return {
    loadTools: tasks.loadTools,
    loadLabels: async (current, scope, currentSignal) => {
      const labels = await started;
      currentSignal.throwIfAborted();
      if (!labels || current !== context || scope.length !== 1 || scope[0].id !== id) return tasks.loadLabels(current, scope, currentSignal);
      return labels.map((label) => ({ ...label, serialNumber: scope[0].serialNumber ?? null }));
    },
  };
}

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
