import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMockIssues } from "@/features/asset-intelligence/issues";
import { issueStatusBadge } from "../status-colors";

const severityBadge: Record<string, "red" | "yellow" | "blue"> = {
  critical: "red",
  attention: "yellow",
  info: "blue",
};

// Full detail view of every reported issue (EMP-02 -> TCARE-01) -- Work Queue
// is the compact/actionable version of the same data, this is the detailed
// read-only record: who reported what, on which asset, when, and its current
// status.
export function ReportsPage() {
  const issues = getMockIssues();

  return (
    <div className="flex flex-col gap-4">
      {issues.map((issue) => (
        <Card key={issue.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                {issue.assetTag}
                <Badge color={severityBadge[issue.severity]} variant="pill">
                  {issue.severity}
                </Badge>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
            </div>
            <Badge color={issueStatusBadge[issue.status].color} variant="pill">
              {issueStatusBadge[issue.status].label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-t1-gray-400">
            <span>Reported by {issue.reportedBy}</span>
            <span>{issue.reportedAt}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
