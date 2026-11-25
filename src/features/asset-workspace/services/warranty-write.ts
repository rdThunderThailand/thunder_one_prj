// Warranty records and writes (Core BE 01) for FE 04–05. Same proxy path as Retire / Edit Asset
// (`v2/asset-workspace/assets/**`, unchanged): the browser sends the registration context, Core checks the role.
import { z } from "zod";
import { assetListSchema } from "./assets-list-types.ts";

const text = z.string().nullable();
export const warrantyRecordSchema = z.object({
  id: z.string(), provider: text, type: text, startDate: text, endDate: text, referenceNo: text, coverageNote: text,
  isCurrent: z.boolean(), createdAt: z.string(), updatedAt: z.string(),
});
export type WarrantyRecord = z.infer<typeof warrantyRecordSchema>;

export type WarrantyRequester = (method: "GET" | "POST" | "PATCH", path: string, body: unknown,
  options: { context: string; signal: AbortSignal }) => Promise<{ status: number; data: unknown }>;
const request: WarrantyRequester = async (method, path, body, options) => {
  const { apiClient } = await import("@/lib/api/client");
  return apiClient.request<unknown>({ url: `/api/proxy/v2/asset-workspace/assets${path}`, baseURL: "", method, data: body,
    headers: { "x-registration-context": options.context }, signal: options.signal,
    timeout: method === "GET" ? 20000 : 65000, validateStatus: () => true });
};

const coreError = z.object({ error: z.object({ code: z.string(), details: z.unknown().optional() }) });
const proxyError = z.object({ error: z.string(), code: z.string().optional(), uncertain: z.boolean().optional() });
export type WarrantyFailure = { ok: false; code: string; uncertain: boolean; details?: unknown };
const fail = (code: string, uncertain: boolean, details?: unknown): WarrantyFailure => ({ ok: false, code, uncertain, details });

async function send<T>(method: "GET" | "POST" | "PATCH", path: string, body: unknown, schema: z.ZodType<T>,
  context: string, signal: AbortSignal, requester: WarrantyRequester): Promise<{ ok: true; data: T } | WarrantyFailure> {
  const write = method !== "GET";
  try {
    const response = await requester(method, path, body, { context, signal });
    const core = coreError.safeParse(response.data);
    const proxy = proxyError.safeParse(response.data);
    // A write that failed with 5xx may still have been saved: never retried, the screen reloads first (Q28).
    if (core.success) return fail(core.data.error.code, write && response.status >= 500, core.data.error.details);
    if (proxy.success) return fail(proxy.data.code ?? "REQUEST_FAILED", write && (proxy.data.uncertain ?? response.status >= 500));
    if (response.status < 200 || response.status >= 300) return fail("REQUEST_FAILED", write && response.status >= 500);
    const parsed = z.object({ data: schema }).safeParse(response.data);
    return parsed.success ? { ok: true, data: parsed.data.data } : fail("INVALID_RESPONSE", write);
  } catch {
    return fail(signal.aborted ? "CANCELLED" : "CONNECTION_FAILED", write && !signal.aborted);
  }
}

/** FE 04 Select Asset: every status except Disposed (Disposed warranties are view only, Q26). */
export type WarrantyAssetSearch = { q: string; page: number; category_id: string; location_id: string };
export const FIRST_WARRANTY_SEARCH: WarrantyAssetSearch = { q: "", page: 1, category_id: "", location_id: "" };
export function warrantyAssetsPath(search: WarrantyAssetSearch) {
  const query = new URLSearchParams({ status: "Available,Assigned,In Maintenance,Retired", pageSize: "10" });
  if (search.page > 1) query.set("page", String(search.page));
  if (search.q) query.set("q", search.q);
  if (search.category_id) query.set("category_id", search.category_id);
  if (search.location_id) query.set("location_id", search.location_id);
  return `/list?${query}`;
}

export function searchWarrantyAssets(context: string, search: WarrantyAssetSearch, signal: AbortSignal, requester = request) {
  return send("GET", warrantyAssetsPath(search), undefined, assetListSchema, context, signal, requester);
}

export const warrantyRecordsSchema = z.array(warrantyRecordSchema);
const one = z.object({ warranty: warrantyRecordSchema });
const asset = (assetId: string) => `/${encodeURIComponent(assetId)}/warranties`;

export const getWarrantyRecords = (context: string, assetId: string, signal: AbortSignal, requester = request) =>
  send("GET", asset(assetId), undefined, warrantyRecordsSchema, context, signal, requester);

export const addWarranty = (context: string, assetId: string, body: unknown, signal: AbortSignal, requester = request) =>
  send("POST", asset(assetId), body, one, context, signal, requester);

export const updateWarranty = (context: string, assetId: string, warrantyId: string, body: unknown, signal: AbortSignal, requester = request) =>
  send("PATCH", `${asset(assetId)}/${encodeURIComponent(warrantyId)}`, body, one, context, signal, requester);

export const setCurrentWarranty = (context: string, assetId: string, warrantyId: string, expectedCurrentId: string | null,
  signal: AbortSignal, requester = request) =>
  send("POST", `${asset(assetId)}/${encodeURIComponent(warrantyId)}/set-current`, { expectedCurrentId }, one, context, signal, requester);

/** Read results in the `useProfileRead` shape (failure carries `status` / `message`). */
export const asProfileRead = <T,>(result: { ok: true; data: T } | WarrantyFailure) =>
  result.ok ? result : { ok: false as const, code: result.code, status: 0, message: result.code };
