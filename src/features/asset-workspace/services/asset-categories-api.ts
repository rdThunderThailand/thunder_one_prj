import { z } from "zod";
import type { CategoryReadResult } from "../domain/asset-category.ts";
import { categoryDetailSchema, categoryListSchema } from "./asset-categories-types.ts";

export type CategoryRequester = (path: string, options: { context: string; signal: AbortSignal }) => Promise<{
  status: number; data: unknown;
}>;

const request: CategoryRequester = async (path, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({
    url: `/api/proxy/v2/asset-workspace/categories${path}`, baseURL: "", method: "GET",
    headers: { "x-registration-context": options.context }, signal: options.signal,
    timeout: 20000, validateStatus: () => true,
  });
};

function failure(status: number): CategoryReadResult<never> {
  const message = status === 401 ? "Your session has expired. Sign in again to load categories."
    : status === 403 ? "You don't have permission, or your account or organization changed. Reload to check your access."
      : status === 404 ? "This category is not available in your organization."
        : status === 400 ? "The category request is invalid. Reload and try again."
          : "Categories could not be loaded. Check your connection and retry.";
  return { ok: false, status, message };
}

async function read<T>(context: string, path: string, schema: z.ZodType<T>, signal: AbortSignal,
  requester: CategoryRequester): Promise<CategoryReadResult<T>> {
  try {
    signal.throwIfAborted();
    const response = await requester(path, { context, signal });
    signal.throwIfAborted();
    if (response.status < 200 || response.status >= 300) return failure(response.status);
    const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(response.data);
    return parsed.success ? { ok: true, data: parsed.data.data } : failure(502);
  } catch (error) {
    if (signal.aborted) throw error;
    return failure(503);
  }
}

export function getCategories(context: string, signal: AbortSignal, requester: CategoryRequester = request) {
  return read(context, "/list", categoryListSchema, signal, requester);
}

export function getCategory(context: string, id: string, signal: AbortSignal, requester: CategoryRequester = request) {
  if (!z.guid().safeParse(id).success) return Promise.resolve(failure(400));
  return read(context, `/${encodeURIComponent(id)}`, categoryDetailSchema, signal, requester);
}
