import type { OverviewStats } from "../core-mapper";
import type { CoreRecentLog } from "../services/dashboard-api";
import { AttentionListCard } from "./AttentionListCard";
import { OnboardingStatusCard } from "./OnboardingStatusCard";
import { OrgStructureCard } from "./OrgStructureCard";
import { OverviewHeader } from "./OverviewHeader";
import { PersonnelBreakdownCard } from "./PersonnelBreakdownCard";
import { QuickActionsRow } from "./QuickActionsRow";
import { StatTilesRow } from "./StatTilesRow";
import { TenureDistributionCard } from "./TenureDistributionCard";
import { TodayActivityCard } from "./TodayActivityCard";

interface OverviewPageProps {
  /** Real since 2026-09-15 (`TodayActivityCard`'s own header comment). */
  todayLogs: CoreRecentLog[] | null;
  /** Real since 2026-09-15 (`../core-mapper.ts`'s `computeOverviewStats`) —
   *  backs StatTilesRow (3 of 5 tiles)/OnboardingStatusCard/OrgStructureCard/
   *  PersonnelBreakdownCard/TenureDistributionCard. `null` when the Core
   *  fetch failed or no tenant/session was resolved, same as `todayLogs`.
   *  AttentionListCard stays fully mock — no "attention items"/task concept
   *  exists in Core at all. */
  stats: OverviewStats | null;
}

// People Workspace's landing page (HR Manager persona) — `/people`.
export function OverviewPage({ todayLogs, stats }: OverviewPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <OverviewHeader />

      {stats === null ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ไม่สามารถโหลดข้อมูลสถิติบุคลากรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      ) : (
        <>
          <StatTilesRow
            totalHeadcount={stats.totalHeadcount}
            newHiresThisMonth={stats.newHiresThisMonth}
            onboardingCount={stats.onboardingCount}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AttentionListCard />
            <OnboardingStatusCard summary={stats.onboardingSummary} rows={stats.onboardingRows} />
            <TodayActivityCard logs={todayLogs} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <OrgStructureCard orgStructureRows={stats.orgStructureRows} />
            <PersonnelBreakdownCard personnelBreakdown={stats.personnelBreakdown} totalHeadcount={stats.totalHeadcount} />
            <TenureDistributionCard tenureDistribution={stats.tenureDistribution} />
          </div>
        </>
      )}

      <QuickActionsRow />
    </div>
  );
}
