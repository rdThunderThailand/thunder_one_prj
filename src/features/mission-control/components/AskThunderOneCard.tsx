import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, PaperPlaneIcon, PhoneIcon, SparklesIcon, UsersIcon } from "@/components/ui/icons";
import { askRecommendations, type AskRecommendation } from "../mock-data";

const iconFor: Record<AskRecommendation["icon"], React.ReactNode> = {
  target: <SparklesIcon />,
  users: <UsersIcon />,
  phone: <PhoneIcon />,
};

// A static preview of an AI assistant panel — no assistant backend exists
// yet, so the input is decorative and the bullets restate what's already on
// the page (Strategic Brief / Needs Attention / Decisions).
export function AskThunderOneCard() {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ask ThunderOne</h2>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          AI
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        <span className="flex-1 truncate">What should I focus on today?</span>
        <PaperPlaneIcon className="h-4 w-4 shrink-0 text-zinc-300" />
      </div>

      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Based on your organization&apos;s data, here&apos;s my recommendation for today.
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {askRecommendations.map((rec) => (
          <li key={rec.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              {iconFor[rec.icon]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{rec.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{rec.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/mission-control/insights"
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        See full analysis
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
