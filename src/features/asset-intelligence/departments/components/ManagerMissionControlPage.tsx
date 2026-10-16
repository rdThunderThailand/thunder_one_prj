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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary bg-accent/40 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <StarIcon className="h-4 w-4 text-primary" />
          Tip: Use Focus Mode to focus on today&apos;s most important things.
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-t1-gray-400"
        >
          <GaugeIcon className="h-3.5 w-3.5" />
          Focus Mode
        </span>
      </div>
    </div>
  );
}
