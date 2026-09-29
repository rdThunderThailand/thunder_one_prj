import type { Metadata } from "next";
import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { resolveAllowedAppIds } from "@/config/tenant-access";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { EmployeeWorkspacesPage, ManagerWorkspacesPage, WorkspacesPage } from "@/features/workspaces";
import { visibleWorkspaces } from "@/features/workspaces/catalog";
import {
  getRecentActivity,
  getWorkspaceStats,
  type CoreRecentLog,
  type WorkspaceStats,
} from "@/features/workspaces/services/workspace-stats-api";

export const metadata: Metadata = { title: "พื้นที่ทำงาน" };

// Every variant shows the same catalog (features/workspaces/catalog.ts),
// narrowed to the Apps this tenant may open (config/tenant-access.ts), with
// real per-App stats; only the manager variant also reads the activity log.
// loading.tsx covers the wait.
export default async function WorkSpaceRoute() {
  const session = await getSession();
  const resolved = resolveRole(session);
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  const workspaces = visibleWorkspaces(resolveAllowedAppIds(session));
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
        workspaces={workspaces}
        stats={stats}
        activity={activity}
        nowIso={nowIso}
      />
    );
  }
  if (variant === "employee") {
    return (
      <EmployeeWorkspacesPage
        workspaces={workspaces}
        stats={stats}
      />
    );
  }

  return (
    <WorkspacesPage
      workspaces={workspaces}
      stats={stats}
      nowIso={nowIso}
    />
  );
}
