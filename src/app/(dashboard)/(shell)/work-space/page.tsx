import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { EmployeeWorkspacesPage, ManagerWorkspacesPage, WorkspacesPage } from "@/features/workspaces";
import {
  getRecentActivity,
  getWorkspaceStats,
  type CoreRecentLog,
  type WorkspaceStats,
} from "@/features/workspaces/services/workspace-stats-api";

// Every variant shows the same catalog (features/workspaces/catalog.ts) with
// real per-App stats; only the manager variant also reads the activity log.
// loading.tsx covers the wait.
export default async function WorkSpaceRoute() {
  const session = await getSession();
  const resolved = resolveRole(session);
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  const nowIso = new Date().toISOString();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  let stats: WorkspaceStats = {};
  let activity: CoreRecentLog[] | null = null;
  if (token && tenantId) {
    [stats, activity] = await Promise.all([
      getWorkspaceStats(token, tenantId),
      variant === "manager" ? getRecentActivity(token, tenantId) : Promise.resolve(null),
    ]);
  }

  if (variant === "manager") {
    return (
      <ManagerWorkspacesPage
        stats={stats}
        activity={activity}
        nowIso={nowIso}
      />
    );
  }
  if (variant === "employee") {
    return <EmployeeWorkspacesPage stats={stats} />;
  }

  return (
    <WorkspacesPage
      stats={stats}
      nowIso={nowIso}
    />
  );
}
