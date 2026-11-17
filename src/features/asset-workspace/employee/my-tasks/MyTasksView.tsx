"use client";

// My Tasks list (EMP-03, UC-007): inventory checks assigned to the caller. Verifying happens on the task page; the
// row's Verify / View button opens it (PO mock 04). No Start / Edit / Cancel / Complete / Close (persona map §2).
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/lovable/button";
import type { ListColumn, ListData } from "../../components/list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../../components/reports/ReportFilterBar";
import { bangkokToday, dueHint } from "../../domain/inventory";
import { SESSION_STATUS_TONE } from "../../domain/status-tone";
import type { SessionRow } from "../../services/asset-reports-api";
import { EmployeeListPage } from "../shared/EmployeeListPage";
import { MY_TASK_STATUSES, myTaskHref, taskOpen } from "./my-tasks";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const WIDE = "hidden md:table-cell";

function columns(today: string): ListColumn<SessionRow>[] {
  return [
    {
      key: "task",
      header: "Task",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={myTaskHref(row.id)}
            className="font-medium text-primary wrap-anywhere hover:underline"
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
          <span className="whitespace-nowrap text-xs tabular-nums">
            {(row.verifiedCount ?? 0).toLocaleString()} / {(row.expectedCount ?? 0).toLocaleString()}
          </span>
          <ProgressBar
            value={row.progressPct}
            color={row.progressPct >= 100 ? "emerald" : "indigo"}
          />
        </div>
      ),
      className: WIDE,
    },
    {
      key: "due",
      header: "Due Date",
      render: (row) => {
        const hint = row.status === "In Progress" ? dueHint(row.dueDate ?? null, today) : null;
        return (
          <div className="whitespace-nowrap">
            <p>{row.dueDate ? dateFmt.format(new Date(row.dueDate)) : "—"}</p>
            {hint && <p className={`text-xs ${hint.overdue ? "text-error" : "text-muted-foreground"}`}>{hint.text}</p>}
          </div>
        );
      },
      className: WIDE,
    },
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
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Button
          asChild
          size="sm"
          variant={taskOpen(row.status) ? "default" : "outline"}
        >
          <Link href={myTaskHref(row.id)}>{taskOpen(row.status) ? "Verify" : "View"}</Link>
        </Button>
      ),
    },
  ];
}

export function MyTasksView({
  data,
  counts,
  searched,
  loading,
}: {
  data: ListData<SessionRow> | null;
  /** Tasks per status tab with the same search; `null` = that count failed. */
  counts: Record<string, number | null>;
  searched: boolean;
  loading?: boolean;
}) {
  return (
    <EmployeeListPage
      title="My Tasks"
      subtitle="Inventory checks assigned to you."
      tabs={[{ key: "all", label: "All" }, ...MY_TASK_STATUSES.map((value) => ({ key: value, label: value }))].map((tab) => ({
        ...tab,
        count: counts[tab.key],
      }))}
      tabParam="status"
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search tasks"
          selects={[]}
        />
      )}
      columns={columns(bangkokToday())}
      data={data}
      getRowId={(row) => row.id}
      rowHref={(row) => myTaskHref(row.id)}
      rowLabel={(row) => row.name}
      itemLabel="tasks"
      emptyTitle={searched ? "No matching tasks" : "No tasks here"}
      emptyBody={searched ? "Try another search or clear the filters." : "Inventory checks assigned to you will appear here."}
      loading={loading}
    />
  );
}

/** Route loading screen: the same page with skeleton rows and counts. */
export function MyTasksLoading() {
  return (
    <MyTasksView
      data={null}
      counts={{}}
      searched={false}
      loading
    />
  );
}
