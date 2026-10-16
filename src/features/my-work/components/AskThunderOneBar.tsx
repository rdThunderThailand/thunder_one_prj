import { Card } from "@/components/ui/Card";
import { PaperPlaneIcon, SparklesIcon } from "@/components/ui/icons";

// A static preview of an AI assistant panel — no assistant backend exists yet.
export function AskThunderOneBar() {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <SparklesIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Ask ThunderOne AI</p>
        <p className="truncate text-xs text-t1-gray-400">Ask, summarize, search tasks, documents, or anything you need</p>
      </div>
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-t1-gray-50 px-3 py-2 text-sm text-t1-gray-400">
        <span className="flex-1 truncate">Ask anything...</span>
        <PaperPlaneIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
      </div>
    </Card>
  );
}
