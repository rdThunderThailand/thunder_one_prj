import Link from "next/link";
import { ArrowRightIcon, GaugeIcon, SparklesIcon, TrendUpIcon, UsersIcon } from "@/components/ui/icons";
import { keyInsights, type KeyInsightData } from "../mock-data";

const iconFor: Record<KeyInsightData["icon"], React.ReactNode> = {
  gauge: <GaugeIcon />,
  users: <UsersIcon />,
  trendUp: <TrendUpIcon />,
};

// A full-width strip rather than a Card — matches the reference's slightly
// tinted "AI" panel, distinct from the plain white cards around it.
export function KeyInsightsCard() {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Key Insights for You</h2>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
          AI
        </span>
        <Link
          href="/mission-control/insights"
          className="ml-auto flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View all insights
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {keyInsights.map((insight) => (
          <div key={insight.id} className="rounded-xl bg-white p-3 dark:bg-zinc-900">
            <span
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${insight.iconTone}`}
            >
              {iconFor[insight.icon]}
            </span>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{insight.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{insight.description}</p>
            <span className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {insight.linkLabel}
              <ArrowRightIcon className="h-3 w-3" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
