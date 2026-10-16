import { Card } from "@/components/ui/Card";
import { PaperPlaneIcon, RepeatIcon, SparklesIcon } from "@/components/ui/icons";
import { managerAskSuggestions } from "../mock-data";

// A static preview of an AI assistant panel — no assistant backend exists yet.
export function AskThunderOneInsightCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ask ThunderOne</h2>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-t1-gray-400">
        <span className="flex-1 truncate">Ask a question to ThunderOne...</span>
        <PaperPlaneIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {managerAskSuggestions.map((s) => (
          <span
            key={s.id}
            title="Not built yet"
            className="cursor-not-allowed rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            {s.text}
          </span>
        ))}
        <button
          type="button"
          title="Refresh suggestions — not built yet"
          className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border text-t1-gray-400"
        >
          <RepeatIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
