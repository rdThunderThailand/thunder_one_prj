import { Card } from "@/components/ui/Card";
import { PaperPlaneIcon, SparklesIcon } from "@/components/ui/icons";

// A static preview of an AI assistant panel — no assistant backend exists yet.
export function EmployeeAskThunderOneCard() {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ask ThunderOne</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Ask anything — e.g. &quot;Summarize my latest campaign results&quot;, &quot;What&apos;s due today&quot;, &quot;Update from yesterday&apos;s meeting&quot;
        </div>
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
          <PaperPlaneIcon className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
