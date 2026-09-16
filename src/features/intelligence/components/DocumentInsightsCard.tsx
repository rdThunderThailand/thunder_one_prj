import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import { documentInsights } from "../mock-data";

export function DocumentInsightsCard() {
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Document Insights</h2>
      <ul className="flex flex-1 flex-col gap-3">
        {documentInsights.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <ClipboardIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{doc.title}</p>
              <p className="text-xs text-zinc-400">{doc.updatedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
