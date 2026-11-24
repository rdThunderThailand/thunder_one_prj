import { Card } from "@/components/ui/Card";
import { PaperPlaneIcon, SparklesIcon } from "@/components/ui/icons";

// A static preview of an AI assistant panel — no assistant backend exists yet.
export function EmployeeAskThunderOneCard() {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ask ThunderOne</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-border bg-t1-gray-50 px-3 py-2.5 text-sm text-t1-gray-400">
          Ask anything — e.g. &quot;Summarize my latest campaign results&quot;, &quot;What&apos;s due today&quot;, &quot;Update from yesterday&apos;s meeting&quot;
        </div>
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <PaperPlaneIcon className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
