import { AssetActionError } from "../domain/asset-action-error.ts";
import { HISTORY_PAGE_SIZE, importHistoryFailure, importHistorySchema } from "../domain/asset-import-history.ts";
import { requestAssetAction, type AssetActionRequester } from "./asset-action-api.ts";

export async function getImportHistory(context: string, page: number, signal: AbortSignal,
  requester: AssetActionRequester = requestAssetAction) {
  try {
    const body = await requester("GET", `/imports?page=${page}&pageSize=${HISTORY_PAGE_SIZE}`, undefined, { context, signal });
    signal.throwIfAborted();
    const parsed = importHistorySchema.safeParse(body);
    if (!parsed.success || parsed.data.page !== page) {
      throw new AssetActionError("The asset service returned unexpected Import History data. Try again.", 502, "INVALID_RESPONSE");
    }
    return parsed.data;
  } catch (error) {
    if (signal.aborted) throw error;
    throw importHistoryFailure(error);
  }
}
