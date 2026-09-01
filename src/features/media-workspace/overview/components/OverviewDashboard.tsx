import { LowerOverview } from "./LowerOverview";
import { ProgramStatusCards } from "./ProgramStatusCards";
import { RecentAlertsCard } from "./RecentAlertsCard";
import { StatCardsRow } from "./StatCardsRow";

export function OverviewDashboard() {
  return (
    <div className="space-y-4">
      <StatCardsRow />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ProgramStatusCards />
        </div>
        <div className="xl:col-span-5">
          <RecentAlertsCard />
        </div>
        <div className="xl:col-span-12">
          <LowerOverview />
        </div>
      </div>
    </div>
  );
}
