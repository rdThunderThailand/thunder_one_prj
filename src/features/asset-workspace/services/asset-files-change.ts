import { z } from "zod";
import { assetFilesChangeInputSchema, assetFilesFeedback, type AssetFilesChangeInput } from "../domain/asset-files-edit.ts";
import { assetFilesSchema } from "./asset-profile-contract.ts";

export const changedAssetFilesSchema = assetFilesSchema.extend({ updatedAt: z.iso.datetime({ offset: true }) });
export type ChangedAssetFiles = z.infer<typeof changedAssetFilesSchema>;
export type AssetFilesRequester = (id: string, input: AssetFilesChangeInput, options: { context: string; signal: AbortSignal }) => Promise<{ status: number; data: unknown }>;
const request: AssetFilesRequester = async (id, input, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({ url: `/api/proxy/v2/asset-workspace/assets/${encodeURIComponent(id)}/files`,
    method: "PATCH", baseURL: "", data: input, headers: { "x-registration-context": options.context },
    signal: options.signal, timeout: 65000, validateStatus: () => true });
};
const envelope = z.object({ success: z.literal(true), data: changedAssetFilesSchema });
const coreError = z.object({ error: z.object({ code: z.string() }) });
const proxyError = z.object({ code: z.string().optional(), error: z.string(), uncertain: z.boolean().optional() });
const failure = (code: string, uncertain = false) => ({ ok: false as const, ...assetFilesFeedback(code, uncertain) });
export type AssetFilesFailure = ReturnType<typeof failure>;

export async function changeAssetFiles(context: string, id: string, input: AssetFilesChangeInput, signal: AbortSignal, requester = request) {
  const valid = assetFilesChangeInputSchema.safeParse(input);
  if (!valid.success || signal.aborted) return failure(signal.aborted ? "CANCELLED" : "VALIDATION");
  try {
    const response = await requester(id, valid.data, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    if (core.success) return failure(core.data.error.code, response.status >= 500);
    if (proxy.success) return failure(proxy.data.code ?? "REQUEST_FAILED", proxy.data.uncertain ?? response.status >= 500);
    if (response.status < 200 || response.status >= 300) return failure("REQUEST_FAILED", response.status >= 500);
    const parsed = envelope.safeParse(response.data);
    return parsed.success ? { ok: true as const, data: parsed.data.data } : failure("INVALID_RESPONSE", true);
  } catch { return failure("CONNECTION_FAILED", true); }
}
