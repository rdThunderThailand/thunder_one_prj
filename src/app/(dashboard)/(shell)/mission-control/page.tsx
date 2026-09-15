import { getAssetSummary } from "@/features/asset-intelligence/assets";
import { EmployeeMissionControlPage, ManagerMissionControlPage } from "@/features/asset-intelligence/departments";
import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { computeHomeStats } from "@/features/mission-control/core-mapper";
import { getRecentLogs } from "@/features/mission-control/services/dashboard-api";
import { MissionControlPage } from "@/features/mission-control";
import { getMembers } from "@/features/people/personnel";

// The dashboard layout already gates this route on tenant access; the
// session is re-fetched here for the greeting's display name and for the
// access gate + variant below, matching getSession's own "nothing is
// trusted to a single check" philosophy.
export default async function MissionControlRoute() {
  const session = await getSession();
  const resolved = resolveRole(session);
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  if (variant === "manager") {
    return <ManagerMissionControlPage />;
  }
  if (variant === "employee") {
    return <EmployeeMissionControlPage />;
  }

  const userName = session === "forbidden" ? "Account" : session.userName;
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <MissionControlPage userName={userName} stats={null} recentLogs={null} />;
  }

  const [memberPage, assetSummary, recentLogs] = await Promise.all([
    getMembers(token, tenantId, { limit: 100 }),
    getAssetSummary(token, tenantId),
    getRecentLogs(token, tenantId),
  ]);

  const stats =
    memberPage === null ? null : computeHomeStats(memberPage.rows, memberPage.count, assetSummary?.total ?? null, new Date());

  return <MissionControlPage userName={userName} stats={stats} recentLogs={recentLogs} />;
}
