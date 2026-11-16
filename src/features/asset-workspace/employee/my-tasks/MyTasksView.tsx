"use client";

// My Tasks list (EMP-03, UC-007): inventory checks assigned to the caller. Read only here; verifying happens on the
// task page. No Start / Edit / Cancel / Complete / Close (persona map §2).
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AssetWorkspaceListPage, type ListColumn, type ListData } from "../../components/list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../../components/reports/ReportFilterBar";
import { bangkokToday, dueHint } from "../../domain/inventory";
import { SESSION_STATUS_TONE } from "../../domain/status-tone";
import type { SessionRow } from "../../services/asset-reports-api";
import { MY_TASK_STATUSES, myTaskHref } from "./my-tasks";

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
  ];
}

export function MyTasksView({ data, filtered }: { data: ListData<SessionRow> | null; filtered: boolean }) {
  return (
    <AssetWorkspaceListPage
      title="My Tasks"
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search tasks"
          selects={[{ key: "status", label: "Status", options: MY_TASK_STATUSES.map((value) => ({ value, label: value })) }]}
        />
      )}
      columns={columns(bangkokToday())}
      data={data}
      getRowId={(row) => row.id}
      itemLabel="tasks"
      emptyTitle={filtered ? "No matching tasks" : "No tasks assigned"}
      emptyBody={filtered ? "Try another search or clear the filters." : "Inventory checks assigned to you will appear here."}
    />
  );
}
