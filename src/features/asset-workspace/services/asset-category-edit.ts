import { z } from "zod";
import type { CategoryEditInput } from "../domain/category-edit.ts";
import { categoryCreateFeedback } from "../domain/category-form.ts";
import { categoryDetailSchema } from "./asset-categories-types.ts";

export type CategoryEditRequester = (id: string, input: CategoryEditInput, options: {
  context: string; signal: AbortSignal;
}) => Promise<{ status: number; data: unknown }>;

const request: CategoryEditRequester = async (id, input, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({
    url: `/api/proxy/v2/asset-workspace/categories/${encodeURIComponent(id)}`, baseURL: "", method: "PATCH", data: input,
    headers: { "x-registration-context": options.context }, signal: options.signal,
    timeout: 65000, validateStatus: () => true,
  });
};
const envelope = z.object({ success: z.literal(true), data: categoryDetailSchema });
const coreError = z.object({ error: z.object({ code: z.string(), details: z.unknown().optional() }) });
const proxyError = z.object({ error: z.string(), code: z.string().optional(), uncertain: z.boolean().optional() });

function failure(status: number, code: string, uncertain: boolean, details?: unknown) {
  const feedback = categoryCreateFeedback(status, code, details, uncertain);
  if (code === "HIERARCHY_LOOP") feedback.fields.parentId = "A category can't sit under itself or its own children.";
  if (code === "INVALID_PARENT") feedback.fields.parentId = "That parent is no longer available. Reload parent options.";
  let message = Object.keys(feedback.fields).length ? "Review the highlighted fields. Your changes have been kept."
    : "The category could not be saved. Your changes have been kept.";
  if (status === 401 || status === 403 || code === "VALIDATION") message = feedback.message;
  if (code === "STALE") message = "Someone else changed this category. Your typed values have been kept. Reload to replace the form with the latest details.";
  if (uncertain) message = "We couldn't confirm this was saved. Open the latest Detail before making another change; this save won't be repeated automatically.";
  return { ok: false as const, status, code, uncertain, message, fields: feedback.fields };
}
export type CategoryEditFailure = ReturnType<typeof failure>;

export async function updateAssetCategory(context: string, id: string, input: CategoryEditInput, signal: AbortSignal,
  requester: CategoryEditRequester = request) {
  if (signal.aborted) return failure(0, "CANCELLED", false);
  try {
    const response = await requester(id, input, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    if (response.status < 200 || response.status >= 300 || core.success || proxy.success) {
      return failure(response.status, core.success ? core.data.error.code : proxy.success ? proxy.data.code ?? "REQUEST_FAILED" : "REQUEST_FAILED",
        proxy.success ? proxy.data.uncertain ?? response.status >= 500 : response.status >= 500,
        core.success ? core.data.error.details : undefined);
    }
    const parsed = envelope.safeParse(response.data);
    return parsed.success && parsed.data.data.id === id ? { ok: true as const, data: parsed.data.data }
      : failure(502, "INVALID_RESPONSE", true);
  } catch {
    return failure(0, "CONNECTION_FAILED", true);
  }
}
