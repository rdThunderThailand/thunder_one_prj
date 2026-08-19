import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import { getMockIssues } from "../mock-data";
import type { IssueStatus } from "../types";

const STEPS: { key: IssueStatus; label: string }[] = [
  { key: "waiting", label: "Waiting IT" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Done" },
];

const severityColor: Record<string, "red" | "yellow" | "blue"> = {
  critical: "red",
  attention: "yellow",
  info: "blue",
};

function StatusTimeline({ status }: { status: IssueStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                index <= currentIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
            <span
              className={`text-xs ${
                index <= currentIndex
                  ? "font-medium text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <span
              className={`h-px w-6 ${index < currentIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function MyServiceStatusPage() {
  const myIssues = getMockIssues().filter((issue) => issue.reportedBy === CURRENT_EMPLOYEE_ID);

  if (myIssues.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        You haven&apos;t reported any problems yet.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {myIssues.map((issue) => (
        <Card key={issue.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {issue.assetTag}
                <Badge color={severityColor[issue.severity]} variant="pill">
                  {issue.severity}
                </Badge>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {issue.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{issue.reportedAt}</span>
          </div>
          <StatusTimeline status={issue.status} />
        </Card>
      ))}
    </div>
  );
}
