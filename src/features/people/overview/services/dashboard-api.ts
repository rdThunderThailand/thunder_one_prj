// Real Thunder_Core integration for OverviewPage's "กิจกรรมวันนี้" card —
// server-only, same shape as org-structure/personnel's services. Wired
// 2026-09-15 (see this feature's README for what else is real vs. still
// blocked on new Core entities, as of the 2026-09-16 mock-data audit).
//
// `GET /tenants/:id/dashboard` is a tenant-wide platform dashboard (also
// used by asset/device features) — its `recentLogs` come from
// `audit_events`, a generic system audit trail (`action`/`description`
// strings), not a curated "today's HR calendar." There is no
// onboarding/change/meeting/training/offboarding tag concept on the Core
// side the way the mock's `ActivityTag` union implied — see
// `../components/TodayActivityCard.tsx`'s header comment for how that gap
// is handled honestly rather than guessed at.
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
