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
  /** Real since 2026-09-15 (`TodayActivityCard`'s own header comment) —
   *  every other card on this page is still mock, see this feature's
   *  README for what's left. */
  todayLogs: CoreRecentLog[] | null;
}

// People Workspace's landing page (HR Manager persona) — `/people`.
export function OverviewPage({ todayLogs }: OverviewPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <OverviewHeader />

      <StatTilesRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionListCard />
        <OnboardingStatusCard />
        <TodayActivityCard logs={todayLogs} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OrgStructureCard />
        <PersonnelBreakdownCard />
        <TenureDistributionCard />
      </div>

      <QuickActionsRow />
    </div>
  );
}
