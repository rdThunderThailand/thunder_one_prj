import "server-only";
import { env } from "@/config/env";
import { lookupFailure, lookupResponseSchema, type LookupQuery, type LookupResult } from "./asset-lookup-contract";

export async function lookupAsset(
  context: { token: string; tenantId: string },
  query: LookupQuery,
  signal: AbortSignal,
): Promise<LookupResult> {
  if (!env.coreApiUrl || !env.coreApiKey) return lookupFailure(503);
  const params = new URLSearchParams({ code: query.code, type: query.type });
  const base = `${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(context.tenantId)}/asset-workspace/assets/lookup`;
  try {
    const response = await fetch(`${base}?${params}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${context.token}` },
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    });
    if (!response.ok) return lookupFailure(response.status);
    const parsed = lookupResponseSchema.safeParse(await response.json().catch(() => null));
    return parsed.success ? { kind: "found", data: parsed.data.data } : lookupFailure(502);
  } catch {
    return lookupFailure(503);
  }
}
