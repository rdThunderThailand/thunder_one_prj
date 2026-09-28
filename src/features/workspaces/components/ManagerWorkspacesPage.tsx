import { LightbulbIcon } from "@/components/ui/icons";
import { ManagerWorkspacesHeader } from "./ManagerWorkspacesHeader";
import { PinnedWorkspacesRow } from "./PinnedWorkspacesRow";
import { MANAGER_QUICK_ACCESS, QuickAccessCard } from "./QuickAccessCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { RecentlyOpenedRow } from "./RecentlyOpenedRow";
import { WorkspaceDirectory } from "./WorkspaceDirectory";
import type { CoreRecentLog, WorkspaceStats } from "../services/workspace-stats-api";

// The department_admin / manager_it_asset ("manager") variant of the
// shell's shared Workspaces page — config/rbac.ts's resolveShellVariant. A
// searchable, pinnable directory over `../catalog.ts` rather than the CEO
// variant's overview dashboard (./WorkspacesPage.tsx).
export function ManagerWorkspacesPage({
  stats,
  activity,
  nowIso,
}: {
  stats: WorkspaceStats;
  activity: CoreRecentLog[] | null;
  nowIso: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ManagerWorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <WorkspaceDirectory
            stats={stats}
            pinnable
          />
          <PinnedWorkspacesRow />
          <RecentlyOpenedRow showCount />
        </div>
        <div className="flex flex-col gap-4">
          <QuickAccessCard items={MANAGER_QUICK_ACCESS} />
          <RecentActivityCard
            logs={activity}
            nowIso={nowIso}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-zinc-700 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-zinc-200">
        <LightbulbIcon className="h-4 w-4 shrink-0 text-indigo-500" />
        Tip: Star the workspaces you use often to pin them for quick access.
      </div>
    </div>
  );
}
