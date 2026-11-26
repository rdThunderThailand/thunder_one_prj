// Scan Asset (EMP-04): Core `/me/scan` answer → the shared lookup result. Pure, so the .check.mts runs with node.
import { lookupDataSchema, lookupFailure, type LookupResult } from "../../services/asset-lookup-contract.ts";

/** 404 covers unknown, other-organization and not-held assets alike (AC-028; decisions.md). */
export function myScanResult(status: number, body: unknown): LookupResult {
  if (status !== 200) return lookupFailure(status);
  const parsed = lookupDataSchema.safeParse((body as { data?: unknown } | null)?.data);
  return parsed.success ? { kind: "found", data: parsed.data } : lookupFailure(502);
}

export const myAssetHref = (id: string) => `/asset-workspace/my-assets/${encodeURIComponent(id)}`;
