import Image from "next/image";
import { Suspense } from "react";
import { ActivityFeedCard } from "./ActivityFeedCard";
import { BriefTeaserCard } from "./BriefTeaserCard";
import { HomeBanner } from "./HomeBanner";
import { HomeHeader } from "./HomeHeader";
import { ActivityFeedSkeleton, HomeStatTilesSkeleton, OrgOverviewSkeleton, TasksCardSkeleton } from "./HomeSkeletons";
import { HomeStatTilesRow } from "./HomeStatTilesRow";
import { NewsCard } from "./NewsCard";
import { OrgOverviewRow } from "./OrgOverviewRow";
import { TasksCard } from "./TasksCard";
import { WorkspaceCardsRow } from "./WorkspaceCardsRow";
import type { HomeStats } from "../core-mapper";
import type { CoreRecentLog } from "../services/dashboard-api";
import type { MyWork } from "@/features/my-work";

interface MissionControlPageProps {
  userName: string;
  /** `../core-mapper.ts`'s `computeHomeStats` — backs every number in
   *  `HomeStatTilesRow`/`OrgOverviewRow`. Passed as an un-awaited promise so
   *  those sections stream in behind their own `<Suspense>` skeletons while
   *  the static parts (header, Brief, workspace cards) paint immediately. */
  stats: Promise<HomeStats>;
  /** `../services/dashboard-api.ts`'s `recentLogs` — backs
   *  `ActivityFeedCard`. Resolves to `null` when the fetch failed. */
  recentLogs: Promise<CoreRecentLog[] | null>;
  /** features/my-work/load-my-work.ts — backs `TasksCard`, the same items
   *  as My Work and the Topbar bell. */
  work: Promise<MyWork>;
}

// The homepage (CEO/Executive/company_admin/tenant/system default landing —
// Manager/Employee get their own variants from asset-intelligence/
// departments, untouched here). **Redesigned 2026-09-16** to match the
// coordinating session's new mockup, replacing the old CEO-strategic-brief
// layout (StrategicBriefCard/DecisionsCard/AskThunderOneCard/
// TodayScheduleCard — all retired, see mock-data.ts's own header comment).
export function MissionControlPage({ userName, stats, recentLogs, work }: MissionControlPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 2026-09-16 — the skyline photo sits absolutely behind this whole
          block (header text + the grid below it), not boxed to just the
          greeting row. Since the header text is shorter than the image's
          260px height, the top of the Brief card / Tasks panel naturally
          renders over the tail of the photo — same layered look as the
          Figma mockup, achieved the same way it does it (one image layer
          behind a taller content block), no negative margins needed. */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[260px] overflow-hidden rounded-2xl">
          <Image
            src="/illustrations/hero-skyline.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent" />
        </div>

        <div className="relative z-10">
          <HomeHeader userName={userName} />

          {/* Widened to a 2/3+1/3 split starting right below the header: the
              right rail (Tasks + News) runs the full height alongside the
              Brief card, stat tiles, and workspace cards too, not just the
              bottom section. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <BriefTeaserCard />
              <Suspense fallback={<HomeStatTilesSkeleton />}>
                <HomeStatTilesRow stats={stats} />
              </Suspense>
              <WorkspaceCardsRow />
              {/* Side-by-side per the mockup (two ~equal panels), not stacked. */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Suspense fallback={<OrgOverviewSkeleton />}>
                  <OrgOverviewRow stats={stats} />
                </Suspense>
                <Suspense fallback={<ActivityFeedSkeleton />}>
                  <ActivityFeedCard logs={recentLogs} />
                </Suspense>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <Suspense fallback={<TasksCardSkeleton />}>
                <TasksCard work={work} />
              </Suspense>
              <NewsCard />
            </div>
          </div>
        </div>
      </div>

      <HomeBanner />
    </div>
  );
}
