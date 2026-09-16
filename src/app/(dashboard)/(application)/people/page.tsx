import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { getOnboardingRoster } from "@/features/people/new-hires/services/onboarding-api";
import { computeOverviewStats } from "@/features/people/overview/core-mapper";
import { OverviewPage } from "@/features/people/overview";
import { getRecentLogs } from "@/features/people/overview/services/dashboard-api";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — People Workspace's landing page (requirement mockup's
// "ภาพรวม"). Real since 2026-09-15 for "กิจกรรมวันนี้" plus StatTilesRow/
// OnboardingStatusCard/OrgStructureCard/PersonnelBreakdownCard/
// TenureDistributionCard (see overview/core-mapper.ts's computeOverviewStats
// for exactly what's derived from what). **2026-09-16**: AttentionListCard
// and StatTilesRow's fabricated tiles (การเปลี่ยนแปลง/ออกจากองค์กร/Workforce
// Health) were removed rather than left showing mock data — see this
// feature's README for what's still blocked on new Core entities.
export default async function PeoplePage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <OverviewPage todayLogs={null} stats={null} />;
  }

  const [logs, onboardingRows, orgTree] = await Promise.all([
    getRecentLogs(token, tenantId),
    getOnboardingRoster(token, tenantId),
    getOrganizations(token, tenantId),
  ]);

  // GET /tenants/:id/dashboard returns the 10 most recent audit-log rows
  // tenant-wide (not scoped to today) — filter down to what actually
  // happened today so the card's own title stays honest. Comparing
  // ISO-date substrings, same simple UTC-day convention this app already
  // uses elsewhere (e.g. bulk-csv.ts's date parsing).
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs === null ? null : logs.filter((log) => log.created_at.slice(0, 10) === today);

  const stats =
    onboardingRows === null
      ? null
      : computeOverviewStats(onboardingRows, mapCoreOrgTree(orgTree ?? [], onboardingRows).units);

  return <OverviewPage todayLogs={todayLogs} stats={stats} />;
}
