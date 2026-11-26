"use server";

// Scan Asset lookup as a server action: Core `GET /me/scan?code=&type=` (only assets the caller holds). The browser
// proxy is not used (contract.md).
import { env } from "@/config/env";
import { reportAuth } from "../../services/asset-reports-api";
import { lookupFailure, lookupQuerySchema, type LookupResult, type LookupType } from "../../services/asset-lookup-contract";
import { myScanResult } from "./my-scan";

export async function scanMyAssetAction(code: string, type: LookupType): Promise<LookupResult> {
  const input = lookupQuerySchema.safeParse({ code, type });
  if (!input.success) return lookupFailure(400);
  const auth = await reportAuth();
  if (!auth) return lookupFailure(401);
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/me/scan?${new URLSearchParams(input.data)}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    return myScanResult(res.status, await res.json().catch(() => null));
  } catch {
    return lookupFailure(503);
  }
}
