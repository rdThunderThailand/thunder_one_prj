import { Card } from "@/components/ui/Card";
import { WarningTriangleIcon } from "@/components/ui/icons";
import { managerTopIssues, type TopIssueData } from "../mock-data";

const severityTone: Record<TopIssueData["severity"], string> = {
  High: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

const iconTone: Record<TopIssueData["severity"], string> = {
  High: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  Medium: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

export function TopIssuesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top Issues</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        {managerTopIssues.map((issue) => (
          <li key={issue.id} className="flex items-start gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconTone[issue.severity]}`}>
              <WarningTriangleIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{issue.title}</p>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${severityTone[issue.severity]}`}
                >
                  {issue.severity}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{issue.timeAgo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
