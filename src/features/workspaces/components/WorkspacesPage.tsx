import { HeroBanner } from "./HeroBanner";
import { NeedHelpCard } from "./NeedHelpCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentlyOpenedRow } from "./RecentlyOpenedRow";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { WorkspaceHealthCard } from "./WorkspaceHealthCard";
import { WorkspaceOverviewCard } from "./WorkspaceOverviewCard";
import { WorkspacesHeader } from "./WorkspacesHeader";
import type { WorkspaceStats } from "../services/workspace-stats-api";

// The CEO/admin variant. Tiles come from `../catalog.ts`, numbers from
// `stats` (real Core reads), Recently Opened from this browser's own history.
export function WorkspacesPage({ stats, nowIso }: { stats: WorkspaceStats; nowIso: string }) {
  const dataAsOf = new Date(nowIso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspacesHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <HeroBanner />
          <WorkspaceGrid stats={stats} />
          <RecentlyOpenedRow />
        </div>
        <div className="flex flex-col gap-4">
          <WorkspaceOverviewCard />
          <WorkspaceHealthCard stats={stats} />
          <QuickActionsCard />
          <NeedHelpCard />
        </div>
      </div>

      <p className="text-right text-xs text-zinc-400">Data as of {dataAsOf} (ICT)</p>
    </div>
  );
}
