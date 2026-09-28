import { MyWorkHeader } from "./MyWorkHeader";
import { QuickFiltersCard } from "./QuickFiltersCard";
import { RecentlyCompletedCard } from "./RecentlyCompletedCard";
import { ScheduleCard } from "./ScheduleCard";
import { StatTilesRow } from "./StatTilesRow";
import { WorkQueue } from "./WorkQueue";
import { WorkSummaryCard } from "./WorkSummaryCard";
import type { MyWork } from "../work-items";

// The CEO/admin variant. Every number and row comes from `work`
// (`../work-items.ts`'s `buildMyWork`, real Core sources); sections with no
// Core source render empty states.
export function MyWorkPage({ work, nowIso }: { work: MyWork; nowIso: string }) {
  const now = new Date(nowIso);
  const dataAsOf = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="flex flex-col gap-6">
      <MyWorkHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <StatTilesRow
            work={work}
            now={now}
          />
          <WorkQueue
            items={work.items}
            nowIso={nowIso}
          />
        </div>
        <div className="flex flex-col gap-4">
          <ScheduleCard />
          <WorkSummaryCard
            items={work.items}
            now={now}
          />
          <QuickFiltersCard
            work={work}
            now={now}
          />
          <RecentlyCompletedCard completed={work.completed} />
        </div>
      </div>

      <p className="text-right text-xs text-zinc-400">Data as of {dataAsOf}</p>
    </div>
  );
}
