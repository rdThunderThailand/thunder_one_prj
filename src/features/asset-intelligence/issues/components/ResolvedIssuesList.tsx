import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import type { Issue } from "../types";

// Shared by every role's Reports page (asset-intelligence/assets, asset-intelligence/departments,
// mission-control) so resolving an issue shows up somewhere at the
// manager level, not just as a live "Open Issues" count. Each caller passes
// its own already-filtered (org-wide / department-scoped / cross-department)
// list rather than this component doing the filtering.
export function ResolvedIssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Nothing resolved yet.
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Recently Resolved
      </h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {issues.map((issue) => (
          <li key={issue.id} className="flex items-center gap-3 py-2.5">
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {issue.assetTag}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {issue.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{issue.resolvedAt}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
