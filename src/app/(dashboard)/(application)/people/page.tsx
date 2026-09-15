import { OverviewPage } from "@/features/people/overview";
import { getRecentLogs } from "@/features/people/overview/services/dashboard-api";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — People Workspace's landing page (requirement mockup's "ภาพรวม").
// Only "กิจกรรมวันนี้" (TodayActivityCard) is wired to real data so far — see
// people/overview's README for what's still mock.
export default async function PeoplePage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <OverviewPage todayLogs={null} />;
  }

  const logs = await getRecentLogs(token, tenantId);
  // GET /tenants/:id/dashboard returns the 10 most recent audit-log rows
  // tenant-wide (not scoped to today) — filter down to what actually
  // happened today so the card's own title stays honest. Comparing
  // ISO-date substrings, same simple UTC-day convention this app already
  // uses elsewhere (e.g. bulk-csv.ts's date parsing).
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs === null ? null : logs.filter((log) => log.created_at.slice(0, 10) === today);

  return <OverviewPage todayLogs={todayLogs} />;
}
