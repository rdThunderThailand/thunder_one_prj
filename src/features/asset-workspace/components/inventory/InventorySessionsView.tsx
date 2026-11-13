"use client";

// Inventory › Sessions list (PO 05 §4.9 · FigJam `486:993`). The server page fetches the KPIs and the page of sessions
// from the URL's filters; this declares the columns and renders the list scaffold.
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { CheckCircleIcon, ClockIcon, InventoryIcon, PlusIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { sessionHref } from "../../domain/inventory";
import { SESSION_STATUSES } from "../../domain/report";
import { SESSION_STATUS_TONE } from "../../domain/status-tone";
import type { InventorySummary } from "../../services/asset-inventory-api";
import type { SessionRow } from "../../services/asset-reports-api";
import { AssetWorkspaceListPage, type ListColumn, type ListData } from "../list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../reports/ReportFilterBar";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const date = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");

const COLUMNS: ListColumn<SessionRow>[] = [
  {
    key: "name",
    header: "Session Name",
    render: (row) => (
      <div className="min-w-48">
        <Link
          href={sessionHref(row)}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
        <p className="text-xs text-muted-foreground">{row.scopeLabel}</p>
      </div>
    ),
  },
  {
    key: "progress",
    header: "Progress",
    render: (row) => (
      <div className="flex min-w-36 items-center gap-2">
        <span className="w-10 text-right tabular-nums">{row.progressPct}%</span>
        <ProgressBar
          value={row.progressPct}
          color={row.progressPct >= 100 ? "emerald" : "indigo"}
        />
      </div>
    ),
  },
  {
    key: "verified",
    header: "Verified",
    render: (row) => `${(row.verifiedCount ?? 0).toLocaleString()} / ${(row.expectedCount ?? 0).toLocaleString()}`,
    className: "whitespace-nowrap tabular-nums",
  },
  {
    key: "issues",
    header: "Issues",
    render: (row) =>
      row.issues ? (
        <Link
          href={`/asset-workspace/inventory/${row.id}/discrepancies`}
          className="font-medium text-t1-red-700 hover:underline"
        >
          {row.issues.toLocaleString()}
        </Link>
      ) : (
        "0"
      ),
    className: "tabular-nums",
  },
  { key: "due", header: "Due Date", render: (row) => date(row.dueDate), className: "whitespace-nowrap" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge
        variant="pill"
        color={SESSION_STATUS_TONE[row.status]}
        className="whitespace-nowrap"
      >
        {row.status}
      </Badge>
    ),
  },
];

export function InventorySessionsView({
  summary,
  data,
}: {
  /** `null` = the KPI fetch failed; tiles show "—". */
  summary: InventorySummary | null;
  data: ListData<SessionRow> | null;
}) {
  const kpi = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString());
  return (
    <AssetWorkspaceListPage
      title="Inventory"
      subtitle="Verify and reconcile physical assets against the system record."
      primaryAction={
        <Link
          href="/asset-workspace/inventory/new"
          className={buttonClasses("primary")}
        >
          <PlusIcon aria-hidden="true" />
          Start Inventory
        </Link>
      }
      summary={
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Active Sessions"
            value={kpi(summary?.activeSessions)}
            color="indigo"
            icon={<InventoryIcon aria-hidden="true" />}
          />
          <StatTile
            label="Assets to Verify"
            value={kpi(summary?.assetsToVerify)}
            color="emerald"
            icon={<CheckCircleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Discrepancies"
            value={kpi(summary?.openDiscrepancies)}
            color="red"
            icon={<WarningTriangleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Due Soon"
            value={kpi(summary?.dueSoon)}
            hint="7 days"
            color="amber"
            icon={<ClockIcon aria-hidden="true" />}
          />
        </div>
      }
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search session name"
          selects={[{ key: "status", label: "Status", options: SESSION_STATUSES.map((value) => ({ value, label: value })) }]}
          dateRange={{ label: "Started", from: "from", to: "to" }}
        />
      )}
      columns={COLUMNS}
      data={data}
      getRowId={(row) => row.id}
      itemLabel="sessions"
      emptyTitle="No inventory sessions"
      emptyBody="Start an inventory to verify assets at one or more locations."
    />
  );
}
