// Core reads for the Overview (E:\ThunderOne\docs\asset-ws-overview-fe-checklist.md §2). Server-only,
// like asset-list-api.ts: the token comes from the session cookie and is passed in. Each call
// fails open to `null` so one missing endpoint shows that widget's error state, not a broken page.
//
// All six are Core v2 reads (sheet rows #6, #27, #33, #78, #1, #85) from Core `feat/asset-ws-v2-*`,
// not on `develop` yet.
import { env } from "@/config/env";
import type { AssetStatus } from "../domain/asset-status";
import { ATTENTION_LIMIT, ATTENTION_WARRANTY_DAYS, type AttentionRow, type BreakdownInput } from "../domain/overview";

async function coreGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2${path}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data as T) ?? null;
  } catch {
    return null;
  }
}

/** #6 — counts per lifecycle status over authorized assets. */
export async function getStatusCounts(token: string, tenantId: string) {
  const data = await coreGet<{ byStatus: { status: AssetStatus; count: number }[] }>(
    `/tenants/${tenantId}/asset-workspace/assets/summary`,
    token,
  );
  return data && Object.fromEntries(data.byStatus.map((row) => [row.status, row.count]));
}

interface NamedCount {
  id: string;
  name: string;
  /** Assets in this group, Disposed not counted. */
  assetCount: number;
}

/** #27 — categories with asset counts. */
export async function getCategoryCounts(token: string, tenantId: string): Promise<BreakdownInput[] | null> {
  const data = await coreGet<NamedCount[]>(`/tenants/${tenantId}/asset-workspace/categories`, token);
  return data && data.map((c) => ({ id: c.id, label: c.name, count: c.assetCount }));
}

interface LocationCount extends BreakdownInput {
  latitude: number | null;
  longitude: number | null;
}

/** #33 — locations with asset counts and coordinates (coordinates feed the map, pending Lead). */
export async function getLocationCounts(token: string, tenantId: string): Promise<LocationCount[] | null> {
  const data = await coreGet<(NamedCount & { latitude: number | null; longitude: number | null })[]>(
    `/tenants/${tenantId}/asset-workspace/locations`,
    token,
  );
  return (
    data &&
    data.map((l) => ({ id: l.id, label: l.name, count: l.assetCount, latitude: l.latitude, longitude: l.longitude }))
  );
}

/** Asset fields the v2 list and warranty reads share. */
interface AssetRef {
  id: string;
  name: string;
  assetTag: string;
  category: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
}

function attentionRow(a: AssetRef, reason: AttentionRow["reason"], date: string): AttentionRow {
  return {
    assetId: a.id,
    assetName: a.name,
    assetTag: a.assetTag,
    category: a.category?.name ?? null,
    location: a.location?.name ?? null,
    reason,
    date,
  };
}

/** #78 — current warranties ending within 30 days, soonest first. */
export async function getExpiringWarranties(token: string, tenantId: string): Promise<AttentionRow[] | null> {
  const data = await coreGet<(AssetRef & { endDate: string })[]>(
    `/tenants/${tenantId}/asset-workspace/warranties/expiring?days=${ATTENTION_WARRANTY_DAYS}&limit=${ATTENTION_LIMIT}`,
    token,
  );
  return data && data.map((a) => attentionRow(a, "Warranty expiring", a.endDate));
}

/** #1 — assets In Maintenance, longest first. */
export async function getInMaintenance(token: string, tenantId: string): Promise<AttentionRow[] | null> {
  const query = new URLSearchParams({
    status: "In Maintenance",
    sort: "status_since",
    pageSize: String(ATTENTION_LIMIT),
  });
  const page = await coreGet<{ data: (AssetRef & { statusSince: string })[] }>(
    `/tenants/${tenantId}/asset-workspace/assets/list?${query}`,
    token,
  );
  return page && page.data.map((a) => attentionRow(a, "In Maintenance", a.statusSince));
}

export interface ActivityEntry {
  id: string;
  /** `audit_events.event_action`, shown as-is so a new action never vanishes. */
  action: string;
  summary: string | null;
  assetId: string | null;
  assetName: string | null;
  actorName: string | null;
  at: string;
}

/** #85 — latest asset events from `audit_events`. */
export function getRecentActivity(token: string, tenantId: string) {
  return coreGet<ActivityEntry[]>(`/tenants/${tenantId}/asset-workspace/activity?limit=5`, token);
}
