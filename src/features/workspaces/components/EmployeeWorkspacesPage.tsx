import { LightbulbIcon } from "@/components/ui/icons";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { EmployeeQuickAccessCard } from "./EmployeeQuickAccessCard";
import { EmployeeRecentlyOpenedRow } from "./EmployeeRecentlyOpenedRow";
import { EmployeeWorkspaceDirectory } from "./EmployeeWorkspaceDirectory";
import { EmployeeWorkspacesHeader } from "./EmployeeWorkspacesHeader";

// The operator / employee_media ("employee") variant of the shell's shared
// Workspaces page — config/rbac.ts's resolveShellVariant. The same
// directory shape as the manager variant (./ManagerWorkspacesPage.tsx), but
// without Pinned Workspaces and with Announcements in the right rail
// instead of Recent Activity, matching the reference mockup.
export function EmployeeWorkspacesPage() {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeWorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <EmployeeWorkspaceDirectory />
          <EmployeeRecentlyOpenedRow />
        </div>
        <div className="flex flex-col gap-4">
          <EmployeeQuickAccessCard />
          <AnnouncementsCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <LightbulbIcon className="h-4 w-4 text-indigo-500" />
          Tip: Pin your favorite workspaces for quick access.
        </span>
        <span
          title="Not built yet"
          className="cursor-not-allowed text-xs font-semibold text-indigo-600 dark:text-indigo-400"
        >
          Manage Pinned Workspaces
        </span>
      </div>
    </div>
  );
}
