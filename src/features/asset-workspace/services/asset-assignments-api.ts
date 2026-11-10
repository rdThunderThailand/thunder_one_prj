import { z } from "zod";
import { currentAssignmentsPageSchema } from "./asset-assignments-contract.ts";
import { assetFiltersSchema } from "./assets-list-types.ts";
import { currentAssignmentQueryString, type CurrentAssignmentQuery } from "../domain/assignment-current.ts";

type AssignmentAuth = { tenantId: string; token: string };
export type AssignmentRead<T> = { ok: true; data: T } | { ok: false; code: string };
export type AssignmentRequester = (path: string, auth: AssignmentAuth) => Promise<{ status: number; data: unknown }>;
const request: AssignmentRequester = async (path, auth) => {
  const { env } = await import("@/config/env");
  const response = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(auth.tenantId)}/asset-workspace/${path}`, {
    headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` }, cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  return { status: response.status, data: await response.json().catch(() => null) };
};
const errorSchema = z.object({ error: z.object({ code: z.string() }) });

async function read<T>(path: string, auth: AssignmentAuth, schema: z.ZodType<T>, requester: AssignmentRequester): Promise<AssignmentRead<T>> {
  try {
    const response = await requester(path, auth);
    const error = errorSchema.safeParse(response.data);
    if (response.status < 200 || response.status >= 300) {
      const code = error.success ? error.data.error.code : response.status === 401 ? "UNAUTHENTICATED"
        : response.status === 403 ? "PERMISSION_DENIED" : response.status === 404 ? "NOT_FOUND" : "REQUEST_FAILED";
      return { ok: false, code };
    }
    const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(response.data);
    return parsed.success ? { ok: true, data: parsed.data.data } : { ok: false, code: "INVALID_RESPONSE" };
  } catch { return { ok: false, code: "CONNECTION_FAILED" }; }
}

export async function getCurrentAssignments(auth: AssignmentAuth, query: CurrentAssignmentQuery, requester = request) {
  const result = await read(`assignments?${currentAssignmentQueryString(query)}`, auth, currentAssignmentsPageSchema, requester);
  if (!result.ok) return result;
  const { data, ...page } = result.data;
  if (page.page !== query.page || page.pageSize !== query.pageSize) return { ok: false as const, code: "INVALID_RESPONSE" };
  return { ok: true as const, data: { rows: data, ...page } };
}
export function getAssignmentFilters(auth: AssignmentAuth, requester = request) {
  return read("assets/filters", auth, assetFiltersSchema, requester);
}
