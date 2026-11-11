import { z } from "zod";
import type { ProfileReadResult } from "./asset-profile-api";
import type { requestAssetWorkspace } from "./asset-workspace-api";

const reference = z.object({ id: z.guid(), name: z.string().nullable() });
const location = reference.extend({ parentId: z.guid().nullable() });
const locationsEnvelope = z.object({ success: z.literal(true), data: z.array(location) });
const timestamp = z.iso.datetime({ offset: true });
const eventSchema = z.object({
  id: z.guid(),
  at: timestamp,
  source: z.enum(["register", "move", "transfer"]),
  from: location.nullable(),
  to: location.nullable(),
  until: timestamp.nullable(),
  reason: z.string().nullable(),
  performedBy: reference.nullable(),
});
const querySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
}).strict();
const pageSchema = querySchema.extend({
  data: z.array(eventSchema),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).refine((page) => page.totalPages === Math.ceil(page.total / page.pageSize)
  && page.data.length <= page.pageSize
  && new Set(page.data.map((event) => event.id)).size === page.data.length);

export type LocationHistoryReference = z.infer<typeof location>;
export type LocationHistoryEvent = z.infer<typeof eventSchema>;
export type LocationHistoryPage = z.infer<typeof pageSchema>;
type LocationHistoryQuery = z.infer<typeof querySchema>;
type Transport = typeof requestAssetWorkspace;
const defaultTransport: Transport = async (...args) => (await import("./asset-workspace-api")).requestAssetWorkspace(...args);

export async function getAssetLocationHistory(context: string, assetId: string, query: LocationHistoryQuery,
  signal: AbortSignal, transport: Transport = defaultTransport): Promise<ProfileReadResult<LocationHistoryPage>> {
  if (!querySchema.safeParse(query).success) return { ok: false, status: 400, code: "VALIDATION", message: "" };
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  const path = `/${encodeURIComponent(assetId)}/location-history?${params}`;
  try {
    const result = pageSchema.safeParse(await transport("GET", path, undefined, { context, signal, timeout: 20000 }));
    if (!result.success || result.data.page !== query.page || result.data.pageSize !== query.pageSize) {
      return { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "" };
    }
    return { ok: true, data: result.data };
  } catch (error) {
    if (signal.aborted) throw error;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code : "UNREACHABLE";
    return { ok: false, status: 0, code, message: "" };
  }
}

/** Member location references for FE 09 paths and the profile Location tab. */
export async function getLocationHistoryLocations(context: string, signal: AbortSignal,
  request: typeof fetch = fetch): Promise<ProfileReadResult<LocationHistoryReference[]>> {
  try {
    const response = await request("/api/proxy/v2/asset-workspace/locations", {
      method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { "x-registration-context": context },
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const failure = z.object({ code: z.string() }).or(z.object({ error: z.object({ code: z.string() }) })).safeParse(body);
      const code = failure.success ? ("code" in failure.data ? failure.data.code : failure.data.error.code) : "REQUEST_FAILED";
      return { ok: false, status: response.status, code, message: "" };
    }
    const result = locationsEnvelope.safeParse(body);
    return result.success ? { ok: true, data: result.data.data }
      : { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "" };
  } catch (error) {
    if (signal.aborted) throw error;
    return { ok: false, status: 0, code: "UNREACHABLE", message: "" };
  }
}
