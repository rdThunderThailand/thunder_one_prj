import { AskThunderOneCard } from "./AskThunderOneCard";
import { DecisionsCard } from "./DecisionsCard";
import { NeedsAttentionCard } from "./NeedsAttentionCard";
import { StrategicBriefCard } from "./StrategicBriefCard";
import { StrategicHeader } from "./StrategicHeader";
import { TodayScheduleCard } from "./TodayScheduleCard";
import { WorkspacesRow } from "./WorkspacesRow";

export function MissionControlPage({ userName }: { userName: string }) {
  const dataAsOf = new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <StrategicHeader userName={userName} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <StrategicBriefCard />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NeedsAttentionCard />
            <DecisionsCard />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <AskThunderOneCard />
          <TodayScheduleCard />
        </div>
      </div>

      <WorkspacesRow />

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
