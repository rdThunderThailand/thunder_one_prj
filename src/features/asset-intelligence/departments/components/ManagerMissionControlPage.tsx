import { GaugeIcon, StarIcon } from "@/components/ui/icons";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { ManagerAttentionCard } from "./ManagerAttentionCard";
import { ManagerDecisionsCard } from "./ManagerDecisionsCard";
import { ManagerMissionControlHeader } from "./ManagerMissionControlHeader";
import { ManagerStatTilesRow } from "./ManagerStatTilesRow";
import { NowNextCard } from "./NowNextCard";
import { TeamActivityCard } from "./TeamActivityCard";
import { TeamGoalsCard } from "./TeamGoalsCard";
import { TeamSnapshotCard } from "./TeamSnapshotCard";

// The department_admin ("manager") variant of the shell's shared Mission
// Control page — see config/rbac.ts's resolveShellVariant. Same
// route as the CEO variant (features/mission-control), different content.
export function ManagerMissionControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerMissionControlHeader />

      <ManagerStatTilesRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ManagerAttentionCard />
        </div>
        <div className="lg:col-span-2">
          <TeamSnapshotCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NowNextCard />
        <TeamActivityCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TeamGoalsCard />
        <ManagerDecisionsCard />
        <AnnouncementsCard />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <StarIcon className="h-4 w-4 text-indigo-500" />
          Tip: Use Focus Mode to focus on today&apos;s most important things.
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-900"
        >
          <GaugeIcon className="h-3.5 w-3.5" />
          Focus Mode
        </span>
      </div>
    </div>
  );
}
