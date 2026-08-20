import { AIAssistantCard } from "./AIAssistantCard";
import { ChannelDistributionCard } from "./ChannelDistributionCard";
import { ChannelStatusCard } from "./ChannelStatusCard";
import { NowNextPublicationsCard } from "./NowNextPublicationsCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentAlertsCard } from "./RecentAlertsCard";
import { StatCardsRow } from "./StatCardsRow";
import { TopPerformingChannelsCard } from "./TopPerformingChannelsCard";

export function OverviewDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <StatCardsRow />
      </div>
      <div className="lg:col-span-1">
        <RecentAlertsCard />
      </div>

      <ChannelDistributionCard />
      <ChannelStatusCard />
      <TopPerformingChannelsCard />

      <div className="lg:col-span-2">
        <NowNextPublicationsCard />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-1">
        <QuickActionsCard />
        <AIAssistantCard />
      </div>
    </div>
  );
}
