import { ActivityFeedCard } from "./ActivityFeedCard";
import { BriefTeaserCard } from "./BriefTeaserCard";
import { HomeBanner } from "./HomeBanner";
import { HomeHeader } from "./HomeHeader";
import { HomeStatTilesRow } from "./HomeStatTilesRow";
import { NewsCard } from "./NewsCard";
import { OrgOverviewRow } from "./OrgOverviewRow";
import { TasksCard } from "./TasksCard";
import { WorkspaceCardsRow } from "./WorkspaceCardsRow";
import type { HomeStats } from "../core-mapper";
import type { CoreRecentLog } from "../services/dashboard-api";

interface MissionControlPageProps {
  userName: string;
  /** Real since 2026-09-16 (`../core-mapper.ts`'s `computeHomeStats`) —
   *  `null` when the underlying People/Asset fetches failed. Backs 3 of the
   *  8 stat tiles across `HomeStatTilesRow`/`OrgOverviewRow`; the rest stay
   *  mock (see those components' own doc comments for exactly which and
   *  why). */
  stats: HomeStats | null;
  /** Real since 2026-09-16 (`../services/dashboard-api.ts`) — backs
   *  `ActivityFeedCard`. `null` means the fetch failed. */
  recentLogs: CoreRecentLog[] | null;
}

// The homepage (CEO/Executive/company_admin/tenant/system default landing —
// Manager/Employee get their own variants from asset-intelligence/
// departments, untouched here). **Redesigned 2026-09-16** to match the
// coordinating session's new mockup, replacing the old CEO-strategic-brief
// layout (StrategicBriefCard/DecisionsCard/AskThunderOneCard/
// TodayScheduleCard — all retired, see mock-data.ts's own header comment).
export function MissionControlPage({ userName, stats, recentLogs }: MissionControlPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <HomeHeader userName={userName} />
      <BriefTeaserCard />
      <HomeStatTilesRow stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <WorkspaceCardsRow />
          <OrgOverviewRow stats={stats} />
          <ActivityFeedCard logs={recentLogs} />
        </div>
        <div className="flex flex-col gap-6">
          <TasksCard />
          <NewsCard />
        </div>
      </div>

      <HomeBanner />
    </div>
  );
}
