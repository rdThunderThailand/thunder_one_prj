import { LightbulbIcon } from "@/components/ui/icons";
import { ManagerRecentlyOpenedRow } from "./ManagerRecentlyOpenedRow";
import { ManagerWorkspaceDirectory } from "./ManagerWorkspaceDirectory";
import { ManagerWorkspacesHeader } from "./ManagerWorkspacesHeader";
import { PinnedWorkspacesRow } from "./PinnedWorkspacesRow";
import { QuickAccessCard } from "./QuickAccessCard";
import { RecentActivityCard } from "./RecentActivityCard";

// The department_admin / manager_it_asset ("manager") variant of the
// shell's shared Workspaces page — config/rbac.ts's resolveShellVariant. A
// workspace directory (search, categories, pinning, per-workspace role)
// rather than the CEO variant's health/overview-dashboard shape
// (./WorkspacesPage.tsx).
export function ManagerWorkspacesPage() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerWorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <ManagerWorkspaceDirectory />
          <PinnedWorkspacesRow />
          <ManagerRecentlyOpenedRow />
        </div>
        <div className="flex flex-col gap-4">
          <QuickAccessCard />
          <RecentActivityCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <LightbulbIcon className="h-4 w-4 text-indigo-500" />
          Tip: Pin the workspaces you use often for quick access. You can rearrange the order anytime.
        </span>
        <span
          title="Not built yet"
          className="cursor-not-allowed text-xs font-semibold text-indigo-600 dark:text-indigo-400"
        >
          Manage Pinned
        </span>
      </div>
    </div>
  );
}
