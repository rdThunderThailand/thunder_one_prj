import { z } from "zod";
import type { AssetCategoryDetail, CategoryStatus } from "../domain/asset-category.ts";
import { categoryDetailSchema } from "./asset-categories-types.ts";

interface StatusInput {
  status: CategoryStatus;
  expectedUpdatedAt: string;
}

export type CategoryStatusRequester = (id: string, input: StatusInput, options: {
  context: string; signal: AbortSignal;
}) => Promise<{ status: number; data: unknown }>;

const request: CategoryStatusRequester = async (id, input, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({
    url: `/api/proxy/v2/asset-workspace/categories/${encodeURIComponent(id)}/status`,
    baseURL: "", method: "POST", data: input,
    headers: { "x-registration-context": options.context }, signal: options.signal,
    timeout: 65000, validateStatus: () => true,
  });
};

export interface CategoryStatusFailure {
  ok: false;
  status: number;
  code: string;
  uncertain: boolean;
  message: string;
}

const envelope = z.object({ success: z.literal(true), data: categoryDetailSchema });
const coreError = z.object({ error: z.object({ code: z.string() }) });
const proxyError = z.object({ error: z.string(), code: z.string().optional(), uncertain: z.boolean().optional() });

function failure(status: number, code: string, uncertain: boolean): CategoryStatusFailure {
  const message = uncertain ? "The status change couldn't be confirmed. Check the latest details before trying again. The action wasn't repeated automatically."
    : code === "STALE" ? "This category changed in another session. Review its latest details before trying again."
      : status === 401 ? "Your session expired. Sign in again before changing the status."
        : status === 403 ? "You don't have permission, or your account or organization changed. Reload to check your access."
          : status === 404 ? "This category is no longer available. Reload to check its details."
            : "The status could not be changed. Reload the category and try again.";
  return { ok: false, status, code, uncertain, message };
}

export async function setAssetCategoryStatus(context: string, category: AssetCategoryDetail, status: CategoryStatus,
  signal: AbortSignal, requester: CategoryStatusRequester = request) {
  if (signal.aborted) return failure(0, "CANCELLED", false);
  try {
    // Pass the concurrency token through unchanged, including PostgreSQL microseconds.
    const response = await requester(category.id, { status, expectedUpdatedAt: category.updatedAt }, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    if (response.status < 200 || response.status >= 300 || core.success || proxy.success) {
      const code = core.success ? core.data.error.code : proxy.success ? proxy.data.code ?? "REQUEST_FAILED" : "REQUEST_FAILED";
      const uncertain = proxy.success ? proxy.data.uncertain ?? response.status >= 500 : response.status >= 500;
      return failure(response.status, code, uncertain);
    }
    const parsed = envelope.safeParse(response.data);
    if (!parsed.success || parsed.data.data.id !== category.id) return failure(502, "INVALID_RESPONSE", true);
    return { ok: true as const, data: parsed.data.data };
  } catch {
    // A timeout or abort after dispatch cannot establish that the write rolled back.
    return failure(0, "CONNECTION_FAILED", true);
  }
}
