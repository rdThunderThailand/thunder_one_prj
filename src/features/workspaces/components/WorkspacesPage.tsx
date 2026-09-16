import { HeroBanner } from "./HeroBanner";
import { NeedHelpCard } from "./NeedHelpCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentlyOpenedRow } from "./RecentlyOpenedRow";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { WorkspaceHealthCard } from "./WorkspaceHealthCard";
import { WorkspaceOverviewCard } from "./WorkspaceOverviewCard";
import { WorkspacesHeader } from "./WorkspacesHeader";

export function WorkspacesPage() {
  const dataAsOf = new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <HeroBanner />
          <WorkspaceGrid />
          <RecentlyOpenedRow />
        </div>
        <div className="flex flex-col gap-4">
          <WorkspaceOverviewCard />
          <WorkspaceHealthCard />
          <QuickActionsCard />
          <NeedHelpCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          All Systems Operational
        </span>
        <span>Data as of {dataAsOf} (ICT)</span>
      </div>
    </div>
  );
}
