import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { getMockIssues } from "@/features/ai-issues";
import { customerAttention, serviceStatTiles, todayCard } from "../mock-data";
import { customerActionColor, customerDotColor, issueStatusBadge } from "../status-colors";

function CustomerAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Customer Attention
        </h2>
        <Link
          href="/asset-intelligence/service-ops/customers"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all
        </Link>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {customerAttention.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${customerDotColor[row.severity]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.subtitle}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${customerActionColor[row.severity]}`}
            >
              Open
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TodayCard() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Today</p>
      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Open Work Orders</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todayCard.openWorkOrders}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">SLA Risk</span>
          <span className="font-medium text-amber-500">{todayCard.slaRisk}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Onsite</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{todayCard.onsite}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Remote</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{todayCard.remote}</span>
        </div>
      </div>
    </Card>
  );
}

function WorkQueueCard() {
  // Internal issues employees report (EMP-02 -> TCARE-01), distinct from the
  // external-customer "Customer Attention" list above (multi-tenant MSP mode).
  const issues = getMockIssues();
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Work Queue</h2>
        <Link
          href="/asset-intelligence/service-ops/work-queue"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {issues.map((issue) => (
          <li key={issue.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {issue.assetTag}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {issue.description}
              </p>
            </div>
            <Badge color={issueStatusBadge[issue.status].color} variant="pill">
              {issueStatusBadge[issue.status].label}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ServiceOpsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {serviceStatTiles.map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} color={tile.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerAttentionCard />
        </div>
        <TodayCard />
      </div>
      <WorkQueueCard />
    </div>
  );
}
