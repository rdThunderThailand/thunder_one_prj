import { isCancel } from "axios";
import { requestAssetWorkspace, AssetWorkspaceRequestError } from "./asset-workspace-api";
import { lookupDataSchema, lookupFailure, lookupQuerySchema, type LookupQuery, type LookupResult } from "./asset-lookup-contract";

export async function identifyAsset(query: LookupQuery, signal: AbortSignal): Promise<LookupResult> {
  const input = lookupQuerySchema.safeParse(query);
  if (!input.success) return lookupFailure(400);
  const params = new URLSearchParams(input.data);
  try {
    const data = await requestAssetWorkspace("GET", `/lookup?${params}`, undefined, { signal, timeout: 17000 });
    const parsed = lookupDataSchema.safeParse(data);
    return parsed.success ? { kind: "found", data: parsed.data } : lookupFailure(502);
  } catch (error) {
    if (signal.aborted || isCancel(error)) throw error;
    return lookupFailure(error instanceof AssetWorkspaceRequestError ? error.status || 503 : 503);
  }
}
