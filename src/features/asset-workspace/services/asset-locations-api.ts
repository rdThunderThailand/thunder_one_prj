// Core reads for the Locations pages (PO 05 §4.8; checklist E:\ThunderOne\docs\location\asset-ws-locations-fe-checklist.md §2).
// Server-only. Writes (create / edit / activate / deactivate) wait for Core PR L2.
import { cache } from "react";
import type { Location, LocationDetail } from "../domain/location";
import { reportAuth, reportGet } from "./asset-reports-api";

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
