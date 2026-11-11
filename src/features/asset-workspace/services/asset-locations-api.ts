// Core reads for the Locations pages (PO 05 §4.8; checklist E:\ThunderOne\docs\location\asset-ws-locations-fe-checklist.md §2).
// Server-only. Writes are Server Actions in asset-locations-actions.ts.
import { cache } from "react";
import type { Location, LocationDetail } from "../domain/location";
import { query, reportAuth, reportGet, toListData, type Page, type SearchParams } from "./asset-reports-api";

const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace/locations`;

/** Every location of the tenant (no paging; the page filters in memory). `null` = failed. */
export const getLocations = cache(async (): Promise<Location[] | null> => {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<Location[]>(base(auth.tenantId), auth.token);
  return Array.isArray(data) ? data : null;
});

/** One location for the Detail header + Overview. `"not-found"` covers another tenant's id too.
 *  `cache` lets the layout and the tab page share one request. */
export const getLocation = cache(async (locationId: string): Promise<LocationDetail | "not-found" | null> => {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<LocationDetail>(`${base(auth.tenantId)}/${encodeURIComponent(locationId)}`, auth.token);
  return data === "unavailable" ? "not-found" : data;
});

// ── Attachments tab (Core #344) ──

export interface LocationAttachment {
  linkId: string;
  fileId: string;
  fileName: string;
  fileType: string | null;
  size: number | null;
  uploadedBy: string | null;
  /** When it was attached. */
  updatedAt: string;
  /** Signed for one hour. */
  url: string | null;
}

/** `?q=&page=&pageSize=` → list data for the scaffold. `null` = failed. */
export async function getLocationAttachments(locationId: string, sp: SearchParams) {
  const auth = await reportAuth();
  if (!auth) return { data: null, unavailable: false };
  const path = `${base(auth.tenantId)}/${encodeURIComponent(locationId)}/attachments${query(sp, ["q", "page", "pageSize"])}`;
  return toListData(await reportGet<Page<LocationAttachment>>(path, auth.token));
}

// ── History tab + Overview Activity (Core #329) ──

export interface LocationHistoryRow {
  id: string;
  at: string;
  action: string;
  summary: string;
  actorName: string | null;
  reason: string | null;
  relatedItem: { type: "asset" | "location" | "file"; id: string; name: string; assetTag?: string } | null;
  changes: { before: Record<string, unknown> | null; after: Record<string, unknown> | null } | null;
}

/** Bangkok calendar day → Core's ISO datetime bound. `to` is exclusive, so the picked end day moves to the next midnight. */
const bangkokDay = (day: string, plusDays = 0) => {
  const d = new Date(`${day}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** `?action=&from=&to=&page=&pageSize=` (dates as YYYY-MM-DD from the filter bar). No search on this route. */
export async function getLocationHistory(locationId: string, sp: SearchParams) {
  const auth = await reportAuth();
  if (!auth) return { data: null, unavailable: false };
  const from = typeof sp.from === "string" && sp.from ? bangkokDay(sp.from) : undefined;
  const to = typeof sp.to === "string" && sp.to ? bangkokDay(sp.to, 1) : undefined;
  const path = `${base(auth.tenantId)}/${encodeURIComponent(locationId)}/history${query({ ...sp, from, to }, ["action", "from", "to", "page", "pageSize"])}`;
  return toListData(await reportGet<Page<LocationHistoryRow>>(path, auth.token));
}
