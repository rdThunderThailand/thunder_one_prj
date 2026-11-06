import { AssetActionError } from "../domain/asset-action-error.ts";
import { labelFailure, labelScope, labelsResponseSchema, type LabelCandidate } from "../domain/asset-labels.ts";
import { readAssetQrValue } from "../domain/asset-qr-reference.ts";
import { requestAssetAction, type AssetActionRequester } from "./asset-action-api.ts";

export async function getAssetLabels(context: string, candidates: readonly LabelCandidate[], signal: AbortSignal,
  requester: AssetActionRequester = requestAssetAction) {
  const scope = labelScope(candidates);
  try {
    const body = await requester("POST", "/labels", { asset_ids: scope.map((asset) => asset.id) }, { context, signal });
    signal.throwIfAborted();
    const parsed = labelsResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.labels.length !== scope.length || parsed.data.labels.some((label, index) => {
      const reference = readAssetQrValue(label.qrValue);
      return label.id.toLowerCase() !== scope[index].id || reference?.assetId !== scope[index].id
        || reference.tenantId !== context.split(":")[0].toLowerCase();
    })) throw new AssetActionError("The asset service returned unexpected label data. Refresh and try again.", 502, "INVALID_RESPONSE");
    return parsed.data.labels;
  } catch (error) {
    if (signal.aborted) throw error;
    throw labelFailure(error, scope);
  }
}
