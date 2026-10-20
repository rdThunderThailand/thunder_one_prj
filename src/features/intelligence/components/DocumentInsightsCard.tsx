import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import { documentInsights } from "../mock-data";

export function DocumentInsightsCard() {
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">Document Insights</h2>
      <ul className="flex flex-1 flex-col gap-3">
        {documentInsights.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClipboardIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
              <p className="text-xs text-t1-gray-400">{doc.updatedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
