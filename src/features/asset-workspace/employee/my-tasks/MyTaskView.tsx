"use client";

// My Tasks › one task (EMP-03, UC-007, AC-016, AC-019, M5): the caller's checklist, Verify, Report Unexpected and
// their findings. No Submit (each verify marks the task Submitted), no Complete / Reconcile / Close.
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { formatDateTime } from "../../components/asset-profile/ProfileParts";
import { AssetWorkspaceListPage, type ListColumn } from "../../components/list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../../components/reports/ReportFilterBar";
import {
  FINDING_LABEL,
  SESSION_ASSET_RESULTS,
  bangkokToday,
  dueHint,
  sessionProgress,
  type Findings,
  type SessionAsset,
  type SessionAssets,
  type SessionDetail,
} from "../../domain/inventory";
import { FINDING_STATE_TONE, INVENTORY_RESULT_TONE, SESSION_STATUS_TONE } from "../../domain/status-tone";
import { MyReportUnexpectedDialog, MyVerifyDialog } from "./MyTaskDialogs";
import { TASK_CLOSED, taskOpen } from "./my-tasks";

export function MyTaskView({ task, assets, findings }: {
  task: SessionDetail;
  /** `null` = the checklist read failed. */
  assets: SessionAssets | null;
  findings: Findings | null;
}) {
  const [verifying, setVerifying] = useState<SessionAsset | null>(null);
  const [reporting, setReporting] = useState(false);
  const open = taskOpen(task.status);
  const progress = sessionProgress(task.counts);
  const hint = open ? dueHint(task.dueDate, bangkokToday()) : null;
  const locations = assets?.byLocation.map((l) => ({ id: l.id, name: l.name })) ?? [];

  const columns: ListColumn<SessionAsset>[] = [
    {
      key: "asset",
      header: "Asset",
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium wrap-anywhere text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.assetTag}</p>
        </div>
      ),
    },
    { key: "location", header: "Expected Location", render: (row) => row.expectedLocation?.name ?? "—", className: "hidden md:table-cell" },
    {
      key: "result",
      header: "Result",
      render: (row) => (
        <Badge
          variant="pill"
          color={row.result ? INVENTORY_RESULT_TONE[row.result] : "zinc"}
          className="whitespace-nowrap"
        >
          {row.result ?? "Remaining"}
        </Badge>
      ),
    },
    ...(open
      ? [{
          key: "verify",
          header: "",
          className: "text-right",
          render: (row: SessionAsset) => (
            <Button
              size="sm"
              variant={row.result ? "outline" : "default"}
              onClick={() => setVerifying(row)}
            >
              {row.result ? "Change" : "Verify"}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Link
        href="/asset-workspace/my-tasks"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeftIcon
          aria-hidden="true"
          className="h-4 w-4"
        />
        My Tasks
      </Link>
      <PageHeader
        title={task.name}
        subtitle={task.scopeLabel}
        actions={open
          ? (
              <Button
                variant="outline"
                onClick={() => setReporting(true)}
              >
                Report Unexpected
              </Button>
            )
          : undefined}
      />
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <Badge
          variant="pill"
          color={SESSION_STATUS_TONE[task.status]}
        >
          {task.status}
        </Badge>
        {hint && <span className={hint.overdue ? "text-error" : "text-muted-foreground"}>{hint.text}</span>}
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <span className="whitespace-nowrap tabular-nums">
            {progress.done.toLocaleString()} / {task.counts.expected.toLocaleString()} checked
          </span>
          <ProgressBar
            value={progress.pct}
            color={progress.pct >= 100 ? "emerald" : "indigo"}
          />
        </div>
      </Card>
      {!open && <p className="text-sm text-muted-foreground">{TASK_CLOSED}</p>}

      <AssetWorkspaceListPage
        embedded
        title="Assets to check"
        filters={(url) => (
          <ReportFilterBar
            url={url}
            searchPlaceholder="Search tag, name or serial"
            selects={[{ key: "result", label: "Result", options: SESSION_ASSET_RESULTS.map((value) => ({ value, label: value })) }]}
          />
        )}
        columns={columns}
        data={assets && { rows: assets.data, page: assets.page, pageSize: assets.pageSize, total: assets.total, totalPages: assets.totalPages }}
        getRowId={(row) => row.snapshotId}
        itemLabel="assets"
        emptyTitle="No assets to check"
        emptyBody="Nothing matches, or no assets are assigned to you in this task."
      />

      <section
        aria-labelledby="my-findings"
        className="space-y-2"
      >
        <h2
          id="my-findings"
          className="text-sm font-semibold text-foreground"
        >
          My Findings
        </h2>
        <Card className="p-4">
          {findings === null ? (
            <p className="text-sm text-error">Couldn&apos;t load your findings.</p>
          ) : findings.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings. Mismatch, Not Found and Unexpected results show here.</p>
          ) : (
            <ul className="divide-y divide-border">
              {findings.data.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="min-w-40 flex-1 wrap-anywhere">
                    {f.asset ? `${f.asset.name} (${f.asset.assetTag})` : f.unexpectedIdentifier ?? "—"}
                  </span>
                  <span className="text-muted-foreground">{FINDING_LABEL[f.type]}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(f.reportedAt)}</span>
                  <Badge
                    variant="pill"
                    color={FINDING_STATE_TONE[f.resolutionState]}
                    className="capitalize"
                  >
                    {f.resolutionState}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {verifying && (
        <MyVerifyDialog
          key={verifying.snapshotId}
          taskId={task.id}
          row={verifying}
          locations={locations}
          onClose={() => setVerifying(null)}
        />
      )}
      {reporting && (
        <MyReportUnexpectedDialog
          taskId={task.id}
          locations={locations}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
