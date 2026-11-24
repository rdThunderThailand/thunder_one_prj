import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import { recentlyAnalyzed } from "../mock-data";

export function RecentlyAnalyzedCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recently Analyzed</h2>
        <button className="text-xs font-medium text-primary hover:text-accent-foreground">
          View all
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        {recentlyAnalyzed.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-t1-gray-400">{item.analyzedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
