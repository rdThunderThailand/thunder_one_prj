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
    <div className="rounded-2xl border border-primary bg-accent/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Key Insights for You</h2>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
          AI
        </span>
        <Link
          href="/mission-control/insights"
          className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground"
        >
          View all insights
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {keyInsights.map((insight) => (
          <div key={insight.id} className="rounded-xl bg-card p-3">
            <span
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${insight.iconTone}`}
            >
              {iconFor[insight.icon]}
            </span>
            <p className="text-sm font-medium text-foreground">{insight.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{insight.description}</p>
            <span className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
              {insight.linkLabel}
              <ArrowRightIcon className="h-3 w-3" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
