// Real Thunder_Core integration for the homepage's "กิจกรรมล่าสุด" card —
// server-only, same shape as every other services/*-api.ts in this app
// (token passed in explicitly, fails open to `null`).
//
// `GET /tenants/:id/dashboard` is a tenant-wide platform dashboard, not a
// People-specific one — `recentLogs` come from `audit_events`, a generic
// system audit trail (`action`/`description` strings). Display counts do
// NOT come from this endpoint's `playerStatus` (it counts the older
// `devices` table) — see channels-api.ts. people/overview's own
// services/dashboard-api.ts calls this exact same endpoint for its "today's activity" card; this is a second,
// independent copy (not a shared import) so mission-control doesn't reach
// into another feature's internal service file — same "each feature owns its
// own services/*-api.ts" convention used everywhere else in this app.
import { coreGet } from "@/lib/core/core-get";

export interface CoreRecentLog {
  id: string;
  created_at: string;
  action: string;
  description: string;
}

interface CoreDashboard {
  recentLogs: CoreRecentLog[];
}

export async function getRecentLogs(token: string, tenantId: string): Promise<CoreRecentLog[] | null> {
  const data = await coreGet<CoreDashboard>(`/tenants/${tenantId}/dashboard`, token);
  return data ? data.recentLogs : null;
}
