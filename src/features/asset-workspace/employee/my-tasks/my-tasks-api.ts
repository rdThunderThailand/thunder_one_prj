// Core reads for My Tasks (EMP-03): `/me/inventory-tasks` and its detail, assets and findings (Thunder_Core
// docs/api/asset-workspace-employee.md). Server-only; Core limits every read to the caller's assignment.
import { cache } from "react";
import type { Findings, SessionAssets, SessionDetail } from "../../domain/inventory";
import { query, reportAuth, reportGet, toListData, type Page, type SearchParams, type SessionRow } from "../../services/asset-reports-api";

const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace/me/inventory-tasks`;

/** List: `?q=&status=&page=&pageSize=`. */
export async function getMyTasks(sp: SearchParams) {
  const auth = await reportAuth();
  if (!auth) return null;
  return toListData(await reportGet<Page<SessionRow>>(`${base(auth.tenantId)}${query(sp, ["q", "status", "page", "pageSize"])}`, auth.token)).data;
}

/** `"not-found"` = not the caller's task, or no such session (README: same Not Found). */
export const getMyTask = cache(async (id: string): Promise<SessionDetail | "not-found" | null> => {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<SessionDetail>(`${base(auth.tenantId)}/${encodeURIComponent(id)}`, auth.token);
  return data === "unavailable" ? "not-found" : data;
});

/** The caller's expected assets: `?q=&result=&page=&pageSize=`. */
export async function getMyTaskAssets(id: string, sp: SearchParams): Promise<SessionAssets | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<SessionAssets>(`${base(auth.tenantId)}/${encodeURIComponent(id)}/assets${query(sp, ["q", "result", "page", "pageSize"])}`, auth.token);
  return data === "unavailable" ? null : data;
}

/** The caller's findings (review, M5); first 50 is enough for one person's part of a session. */
export async function getMyTaskFindings(id: string): Promise<Findings | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const data = await reportGet<Findings>(`${base(auth.tenantId)}/${encodeURIComponent(id)}/findings?pageSize=50`, auth.token);
  return data === "unavailable" ? null : data;
}
