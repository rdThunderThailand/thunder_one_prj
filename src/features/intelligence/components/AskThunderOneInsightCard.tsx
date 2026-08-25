import { Card } from "@/components/ui/Card";
import { PaperPlaneIcon, RepeatIcon, SparklesIcon } from "@/components/ui/icons";
import { managerAskSuggestions } from "../mock-data";

// A static preview of an AI assistant panel — no assistant backend exists yet.
export function AskThunderOneInsightCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ask ThunderOne</h2>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        <span className="flex-1 truncate">Ask a question to ThunderOne...</span>
        <PaperPlaneIcon className="h-4 w-4 shrink-0 text-zinc-300" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {managerAskSuggestions.map((s) => (
          <span
            key={s.id}
            title="Not built yet"
            className="cursor-not-allowed rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {s.text}
          </span>
        ))}
        <button
          type="button"
          title="Refresh suggestions — not built yet"
          className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <RepeatIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
