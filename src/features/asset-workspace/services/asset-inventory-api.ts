// Core reads for the Inventory pages (PO 05 §4.9; checklist E:\ThunderOne\docs\inventory\asset-ws-inventory-checklist.md §2).
// Server-only. Writes and the scope preview (a POST) are Server Actions in asset-inventory-actions.ts.
import { cache } from "react";
import { startedRange, type Person, type SessionDetail } from "../domain/inventory";
import { assetFiltersSchema, type AssetFilterOptions } from "./assets-list-types";
import { query, reportAuth, reportGet, toListData, type Page, type SearchParams, type SessionRow } from "./asset-reports-api";

const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace`;

export interface InventorySummary {
  activeSessions: number;
  assetsToVerify: number;
  openDiscrepancies: number;
  dueSoon: number;
}

export async function getInventorySummary(): Promise<InventorySummary | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<InventorySummary>(`${base(auth.tenantId)}/inventory-sessions/summary`, auth.token);
  return data === "unavailable" ? null : data;
}

/** List page: `?q=&status=&from=&to=&page=&pageSize=`; the date pair is days on screen, instants for Core. */
export async function getInventorySessions(sp: SearchParams) {
  const auth = await reportAuth();
  if (!auth) return { data: null, unavailable: false };
  const one = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);
  const params = { ...sp, from: undefined, to: undefined, ...startedRange(one("from"), one("to")) };
  const path = `${base(auth.tenantId)}/inventory-sessions${query(params, ["q", "status", "from", "to", "page", "pageSize"])}`;
  return toListData(await reportGet<Page<SessionRow>>(path, auth.token));
}

/** One session for the wizard / header. `"not-found"` covers another tenant's id and a session not assigned to a
 *  non-Admin caller. `cache` lets a layout and its page share one request. */
export const getInventorySession = cache(async (sessionId: string): Promise<SessionDetail | "not-found" | null> => {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<SessionDetail>(`${base(auth.tenantId)}/inventory-sessions/${encodeURIComponent(sessionId)}`, auth.token);
  return data === "unavailable" ? "not-found" : data;
});

/** Owner dropdown: active Asset Admins. Core answers 403 to anyone else, which comes back as `null`. */
export async function getInventoryOwners(): Promise<(Person & { email: string | null })[] | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  // The route answers `{ data: [...] }` inside the v2 envelope.
  const body = await reportGet<{ data: (Person & { email: string | null })[] }>(`${base(auth.tenantId)}/inventory-sessions/owners`, auth.token);
  return body && body !== "unavailable" && Array.isArray(body.data) ? body.data : null;
}

/** Step 2 choices: Locations, Categories and Custodians (person / OU) from `assets/filters`.
 *  ponytail: the OU choices are the OUs holding custody today, so an OU known only through its members' departments is
 *  missing; switch to the org-unit selector if PO needs every OU. */
export async function getScopeOptions(): Promise<AssetFilterOptions | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const parsed = assetFiltersSchema.safeParse(await reportGet<unknown>(`${base(auth.tenantId)}/assets/filters`, auth.token));
  return parsed.success ? parsed.data : null;
}
