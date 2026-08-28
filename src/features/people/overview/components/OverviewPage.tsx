import { AttentionListCard } from "./AttentionListCard";
import { OnboardingStatusCard } from "./OnboardingStatusCard";
import { OrgStructureCard } from "./OrgStructureCard";
import { OverviewHeader } from "./OverviewHeader";
import { PersonnelBreakdownCard } from "./PersonnelBreakdownCard";
import { QuickActionsRow } from "./QuickActionsRow";
import { StatTilesRow } from "./StatTilesRow";
import { TenureDistributionCard } from "./TenureDistributionCard";
import { TodayActivityCard } from "./TodayActivityCard";

// People Workspace's landing page (HR Manager persona) — `/people`.
export function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewHeader />

      <StatTilesRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionListCard />
        <OnboardingStatusCard />
        <TodayActivityCard />
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
