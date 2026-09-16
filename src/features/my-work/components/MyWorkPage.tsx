import { MyWorkHeader } from "./MyWorkHeader";
import { QuickFiltersCard } from "./QuickFiltersCard";
import { RecentlyCompletedCard } from "./RecentlyCompletedCard";
import { ScheduleCard } from "./ScheduleCard";
import { StatTilesRow } from "./StatTilesRow";
import { WorkQueue } from "./WorkQueue";
import { WorkSummaryCard } from "./WorkSummaryCard";

export function MyWorkPage() {
  const dataAsOf = new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <MyWorkHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <StatTilesRow />
          <WorkQueue />
        </div>
        <div className="flex flex-col gap-4">
          <ScheduleCard />
          <WorkSummaryCard />
          <QuickFiltersCard />
          <RecentlyCompletedCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          All Systems Operational
        </span>
        <span>Data as of {dataAsOf}</span>
      </div>
    </div>
  );
}
