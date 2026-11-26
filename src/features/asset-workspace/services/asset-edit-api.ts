import { z } from "zod";
import { assetEditFeedback, type AssetEditInput } from "../domain/asset-edit.ts";
import { assetDetailSchema } from "./asset-profile-contract.ts";

export type AssetEditRequester = (id: string, input: AssetEditInput, options: { context: string; signal: AbortSignal }) => Promise<{ status: number; data: unknown }>;
const request: AssetEditRequester = async (id, input, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({ url: `/api/proxy/v2/asset-workspace/assets/${encodeURIComponent(id)}`,
    baseURL: "", method: "PATCH", data: input, headers: { "x-registration-context": options.context },
    signal: options.signal, timeout: 65000, validateStatus: () => true });
};
const envelope = z.object({ success: z.literal(true), data: assetDetailSchema });
const coreError = z.object({ error: z.object({ code: z.string(), details: z.unknown().optional() }) });
const proxyError = z.object({ error: z.string(), code: z.string().optional(), uncertain: z.boolean().optional() });
const failure = (code: string, details?: unknown, uncertain = false) => ({ ok: false as const, ...assetEditFeedback(code, details, uncertain) });
export type AssetEditFailure = ReturnType<typeof failure>;

export async function updateAssetDetails(context: string, id: string, input: AssetEditInput, signal: AbortSignal, requester = request) {
  if (signal.aborted) return failure("CANCELLED");
  try {
    const response = await requester(id, input, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    if (core.success) return failure(core.data.error.code, core.data.error.details, response.status >= 500);
    if (proxy.success) return failure(proxy.data.code ?? "REQUEST_FAILED", undefined, proxy.data.uncertain ?? response.status >= 500);
    if (response.status < 200 || response.status >= 300) return failure("REQUEST_FAILED", undefined, response.status >= 500);
    const parsed = envelope.safeParse(response.data);
    return parsed.success && parsed.data.data.id === id ? { ok: true as const, data: parsed.data.data }
      : failure("INVALID_RESPONSE", undefined, true);
  } catch {
    return failure("CONNECTION_FAILED", undefined, true);
  }
}
