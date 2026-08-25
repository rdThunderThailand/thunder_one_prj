import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, PaperPlaneIcon, SparklesIcon } from "@/components/ui/icons";
import { askSuggestions } from "../mock-data";

// A static preview of an AI assistant panel — no assistant backend exists
// yet, so the input and suggestion chips are decorative.
export function AskThunderOneRail() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ask ThunderOne</h2>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          AI
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        <span className="flex-1 truncate">Ask anything about your organization...</span>
        <PaperPlaneIcon className="h-4 w-4 shrink-0 text-zinc-300" />
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">Try asking</p>
      <ul className="flex flex-col gap-2">
        {askSuggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            title="Not built yet"
            className="cursor-not-allowed rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {suggestion.text}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        See more examples
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
