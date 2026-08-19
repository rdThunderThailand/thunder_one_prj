import { AssetOutlookCard } from "./AssetOutlookCard";
import { RecentAlertsCard } from "./RecentAlertsCard";
import { RequiresAttentionCard } from "./RequiresAttentionCard";
import { StatCardsRow } from "./StatCardsRow";

export function MissionControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <StatCardsRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RequiresAttentionCard />
        <AssetOutlookCard />
      </div>
      <RecentAlertsCard />
    </div>
  );
}
