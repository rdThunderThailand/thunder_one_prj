import { z } from "zod";
import type { CategoryCreateInput, CategoryFormErrors } from "../domain/category-form.ts";
import { categoryCreateFeedback } from "../domain/category-form.ts";
import { categoryDetailSchema } from "./asset-categories-types.ts";

export type CategoryCreateRequester = (input: CategoryCreateInput, options: {
  context: string; signal: AbortSignal;
}) => Promise<{ status: number; data: unknown }>;

const request: CategoryCreateRequester = async (input, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({
    url: "/api/proxy/v2/asset-workspace/categories", baseURL: "", method: "POST", data: input,
    headers: { "x-registration-context": options.context }, signal: options.signal,
    timeout: 65000, validateStatus: () => true,
  });
};

export interface CategoryCreateFailure {
  ok: false;
  code: string;
  status: number;
  uncertain: boolean;
  message: string;
  fields: CategoryFormErrors;
}

const envelope = z.object({ success: z.literal(true), data: categoryDetailSchema });
const coreError = z.object({ error: z.object({ code: z.string(), details: z.unknown().optional() }) });
const proxyError = z.object({ code: z.string().optional(), uncertain: z.boolean().optional(), error: z.string() });
function failure(status: number, code: string, uncertain: boolean, details?: unknown): CategoryCreateFailure {
  return { ok: false, status, code, uncertain, ...categoryCreateFeedback(status, code, details, uncertain) };
}

export async function createAssetCategory(context: string, input: CategoryCreateInput, signal: AbortSignal,
  requester: CategoryCreateRequester = request) {
  if (signal.aborted) return failure(0, "CANCELLED", false);
  try {
    const response = await requester(input, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    if (response.status < 200 || response.status >= 300 || core.success || proxy.success) {
      const code = core.success ? core.data.error.code : proxy.success ? proxy.data.code ?? "REQUEST_FAILED" : "REQUEST_FAILED";
      const uncertain = proxy.success ? proxy.data.uncertain ?? response.status >= 500 : response.status >= 500;
      return failure(response.status, code, uncertain, core.success ? core.data.error.details : undefined);
    }
    const parsed = envelope.safeParse(response.data);
    // A successful write with an unreadable response may already have committed.
    return parsed.success ? { ok: true as const, data: parsed.data.data } : failure(502, "INVALID_RESPONSE", true);
  } catch {
    // Timeout/cancellation after dispatch cannot prove the write was rolled back.
    return failure(0, "CONNECTION_FAILED", true);
  }
}
