import { Card } from "@/components/ui/Card";
import { WarningTriangleIcon } from "@/components/ui/icons";
import { managerTopIssues, type TopIssueData } from "../mock-data";

const severityTone: Record<TopIssueData["severity"], string> = {
  High: "bg-error-muted text-t1-red-700",
  Medium: "bg-warning-muted text-t1-amber-700",
};

const iconTone: Record<TopIssueData["severity"], string> = {
  High: "bg-error-muted text-error",
  Medium: "bg-warning-muted text-warning",
};

export function TopIssuesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Top Issues</h2>
        <button className="text-xs font-medium text-primary hover:text-accent-foreground">
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
                <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${severityTone[issue.severity]}`}
                >
                  {issue.severity}
                </span>
              </div>
              <p className="text-xs text-t1-gray-400">{issue.timeAgo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
