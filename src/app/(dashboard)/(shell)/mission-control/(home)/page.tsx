import { getAssetSummary } from "@/features/asset-intelligence/assets";
import { EmployeeMissionControlPage, ManagerMissionControlPage } from "@/features/asset-intelligence/departments";
import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { computeHomeStats, type HomeStats } from "@/features/mission-control/core-mapper";
import { getChannelHealthSummary } from "@/features/mission-control/services/channels-api";
import { getRecentLogs } from "@/features/mission-control/services/dashboard-api";
import { MissionControlPage } from "@/features/mission-control";
import { loadMyWork } from "@/features/my-work/load-my-work";
import { EMPTY_MY_WORK } from "@/features/my-work/work-items";
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
    return (
      <MissionControlPage
        userName={userName}
        stats={Promise.resolve(computeHomeStats(null, null, null, new Date()))}
        recentLogs={Promise.resolve(null)}
        work={Promise.resolve(EMPTY_MY_WORK)}
      />
    );
  }

  // Deliberately not awaited: MissionControlPage streams each data section
  // behind its own <Suspense> skeleton, so the page shell paints right away.
  const stats: Promise<HomeStats> = Promise.all([
    getMembers(token, tenantId, { limit: 100 }),
    getAssetSummary(token, tenantId),
    getChannelHealthSummary(token),
  ]).then(([memberPage, assetSummary, channels]) => computeHomeStats(memberPage, assetSummary, channels, new Date()));
  const recentLogs = getRecentLogs(token, tenantId);
  // Only the CEO/admin variant reaches here (manager/employee returned above),
  // so the "admin" scope — same as My Work and the bell for this user.
  const userId = session !== "forbidden" ? session.userId : null;
  const work = loadMyWork(token, tenantId, userId, "admin");

  return (
    <MissionControlPage
      userName={userName}
      stats={stats}
      recentLogs={recentLogs}
      work={work}
    />
  );
}
