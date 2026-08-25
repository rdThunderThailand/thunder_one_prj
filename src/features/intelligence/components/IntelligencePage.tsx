import { AskThunderOneRail } from "./AskThunderOneRail";
import { DataSourcesCard } from "./DataSourcesCard";
import { DepartmentOverviewRow } from "./DepartmentOverviewRow";
import { IntelligenceHeader } from "./IntelligenceHeader";
import { KeyInsightsCard } from "./KeyInsightsCard";
import { MetricsRow } from "./MetricsRow";
import { PerformanceTrendCard } from "./PerformanceTrendCard";
import { RiskRadarCard } from "./RiskRadarCard";
import { StrategicObjectivesCard } from "./StrategicObjectivesCard";

export function IntelligencePage() {
  const dataAsOf = new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <IntelligenceHeader />

      <MetricsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <KeyInsightsCard />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StrategicObjectivesCard />
            <PerformanceTrendCard />
            <RiskRadarCard />
          </div>
          <DepartmentOverviewRow />
        </div>
        <div className="flex flex-col gap-4">
          <AskThunderOneRail />
          <DataSourcesCard />
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
