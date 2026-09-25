import { AnnouncementsCard } from "./AnnouncementsCard";
import { EmployeeWorkspacesHeader } from "./EmployeeWorkspacesHeader";
import { EMPLOYEE_QUICK_ACCESS, QuickAccessCard } from "./QuickAccessCard";
import { RecentlyOpenedRow } from "./RecentlyOpenedRow";
import { WorkspaceDirectory } from "./WorkspaceDirectory";
import type { WorkspaceStats } from "../services/workspace-stats-api";

// The operator / employee_media ("employee") variant of the shell's shared
// Workspaces page — config/rbac.ts's resolveShellVariant. The same directory
// as the manager variant, without pinning, with Announcements in the rail.
export function EmployeeWorkspacesPage({ stats }: { stats: WorkspaceStats }) {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeWorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <WorkspaceDirectory stats={stats} />
          <RecentlyOpenedRow showCount />
        </div>
        <div className="flex flex-col gap-4">
          <QuickAccessCard items={EMPLOYEE_QUICK_ACCESS} />
          <AnnouncementsCard />
        </div>
      </div>
    </div>
  );
}
