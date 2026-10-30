import { isCancel } from "axios";
import { apiClient } from "@/lib/api/client";
import { lookupFailure, lookupResponseSchema, type LookupQuery, type LookupResult } from "./asset-lookup-contract";

export async function identifyAsset(query: LookupQuery, signal: AbortSignal): Promise<LookupResult> {
  try {
    const response = await apiClient.get<unknown>("/api/asset-workspace/assets/lookup", {
      params: query,
      signal,
      timeout: 17000,
      validateStatus: () => true,
      // This endpoint belongs to this frontend, regardless of the generic client's base URL.
      baseURL: "",
    });
    if (response.status !== 200) return lookupFailure(response.status);
    const parsed = lookupResponseSchema.safeParse(response.data);
    return parsed.success ? { kind: "found", data: parsed.data.data } : lookupFailure(502);
  } catch (error) {
    if (signal.aborted || isCancel(error)) throw error;
    return lookupFailure(503);
  }
}
