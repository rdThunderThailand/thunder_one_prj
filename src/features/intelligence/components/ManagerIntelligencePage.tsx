import { AiSuggestedCard } from "./AiSuggestedCard";
import { AskThunderOneInsightCard } from "./AskThunderOneInsightCard";
import { ExploreDataRow } from "./ExploreDataRow";
import { ManagerInsightsRow } from "./ManagerInsightsRow";
import { ManagerIntelligenceHeader } from "./ManagerIntelligenceHeader";
import { RecentlyAnalyzedCard } from "./RecentlyAnalyzedCard";
import { ScopeCard } from "./ScopeCard";
import { TopIssuesCard } from "./TopIssuesCard";
import { WatchingMetricsRow } from "./WatchingMetricsRow";
import { PlayIcon, SparklesIcon } from "@/components/ui/icons";

// The department_admin / manager_it_asset ("manager") variant of the
// shell's shared Intelligence page — config/rbac.ts's resolveShellVariant.
// An AI-first insights layout rather than the CEO variant's metrics
// dashboard (./IntelligencePage.tsx).
export function ManagerIntelligencePage() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerIntelligenceHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <AskThunderOneInsightCard />
        </div>
        <div>
          <ScopeCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ManagerInsightsRow />
          <WatchingMetricsRow />
          <ExploreDataRow />
        </div>
        <div className="flex flex-col gap-4">
          <AiSuggestedCard />
          <TopIssuesCard />
          <RecentlyAnalyzedCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <SparklesIcon className="h-4 w-4 text-indigo-500" />
          Tip: Chat with ThunderOne AI for faster answers and insights.
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-900"
        >
          See how to use
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
