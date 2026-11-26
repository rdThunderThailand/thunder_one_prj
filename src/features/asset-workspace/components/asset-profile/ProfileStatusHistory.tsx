"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetStatusHistory } from "../../services/asset-profile-api";
import type { AssetStatusChange } from "../../services/asset-profile-contract";
import { AssignmentHistoryTime } from "../assignments/AssignmentsHistoryValues";
import { ProfileAssignmentPager } from "../assignments/ProfileAssignmentPager";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ConditionValue } from "./ProfileParts";
import { ProfileStatusHistoryPanel, StatusHistoryValue } from "./ProfileStatusHistoryPanel";

const columns = ["#", "Date & Time", "From Status", "To Status", "Condition", "Changed By", "Reason"];
// Fits the 3fr column at 1366 px; Reason takes the rest.
const widths = ["w-9", "w-24", "w-28", "w-28", "w-20", "w-28", ""];
const ALL = "__all__";

export function ProfileStatusHistory({ context, assetId, enabled, layout }: {
  context: string; assetId: string; enabled: boolean;
  layout: (content: ReactNode, panel: ReactNode) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssetStatus | null>(null);
  // undefined: first row of the page; null: panel closed.
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const history = useProfileRead(`${context}:${assetId}:status-history:${status ?? "all"}:${page}`,
    (signal) => getAssetStatusHistory(context, assetId, page, status, signal), enabled);

  if (!enabled) return layout(null, null);
  const result = history.result?.ok ? history.result.data : null;
  const selected = selectedId === null ? null
    : result?.data.find((row) => row.id === selectedId) ?? result?.data[0] ?? null;
  function goToPage(next: number) {
    setPage(next);
    setSelectedId(undefined);
  }

  let results;
  if (!history.result || (history.pending && !result)) {
    results = <StatusHistoryLoading />;
  } else if (!history.result.ok) {
    const code = history.result.code;
    results = (
      <div className="p-4">
        {code === "NOT_FOUND" ? (
          <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
        ) : code === "PERMISSION_DENIED" ? (
          <AccessDeniedState title="You don't have access" body="You don't have permission to view this asset's status history." />
        ) : code === "UNAUTHENTICATED" ? (
          <EmptyState title="Sign in required" body="Your session has expired. Sign in again to view this asset." />
        ) : (
          <ErrorState title="Couldn't load status history" body="Check your connection and retry." onRetry={history.reload} />
        )}
      </div>
    );
  } else if (result && !result.data.length) {
    results = (
      <div className="p-4">
        {result.total > 0 || result.page > 1 ? (
          <EmptyState title="No status changes on this page"
            action={<Button variant="outline" onClick={() => goToPage(1)}>Go to first page</Button>} />
        ) : status ? (
          <EmptyState title="No changes to this status." body="Choose another status or All Status." />
        ) : (
          <EmptyState title="No status changes yet." body="Status changes will appear here." />
        )}
      </div>
    );
  } else if (result) {
    results = (
      <div className="flex min-h-64 flex-1 flex-col justify-between">
        <StatusHistoryTable rows={result.data} page={result.page} pageSize={result.pageSize}
          selectedId={selected?.id} onSelect={(row) => setSelectedId(row.id)} />
        <ProfileAssignmentPager page={result.page} pageSize={result.pageSize} total={result.total}
          totalPages={result.totalPages} itemLabel="records" onPageChange={goToPage} />
      </div>
    );
  }

  const content = (
    <Card className="min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={history.pending}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-2">
          <ClockIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">Status History</h2>
            <p className="text-xs text-muted-foreground">Track all status changes for this asset.</p>
          </div>
        </div>
        <Select value={status ?? ALL} onValueChange={(value) => {
          setStatus(value === ALL ? null : value as AssetStatus);
          goToPage(1);
        }}>
          <SelectTrigger aria-label="Filter by status" className="h-9 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Status</SelectItem>
            {ASSET_STATUSES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {results}
    </Card>
  );
  return layout(content, selected ? (
    <ProfileStatusHistoryPanel change={selected} onClose={() => setSelectedId(null)} />
  ) : null);
}

function StatusHistoryTable({ rows, page, pageSize, selectedId, onSelect }: {
  rows?: AssetStatusChange[]; page?: number; pageSize?: number; selectedId?: string;
  onSelect?: (row: AssetStatusChange) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="relative w-full min-w-xl table-fixed text-left text-xs">
        <caption className="sr-only">Status history records</caption>
        <colgroup>
          {widths.map((width, index) => <col key={columns[index]} className={width} />)}
        </colgroup>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((heading) => (
              <th key={heading} scope="col" aria-sort={heading === "Date & Time" ? "descending" : undefined}
                className="border-b border-border px-3 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows ? rows.map((row, index) => {
            const selected = row.id === selectedId;
            return (
              <tr key={row.id} tabIndex={0} aria-selected={selected}
                onClick={() => onSelect?.(row)}
                onKeyDown={(press) => {
                  if (press.target !== press.currentTarget || (press.key !== "Enter" && press.key !== " ")) return;
                  press.preventDefault();
                  onSelect?.(row);
                }}
                className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected
                  ? "bg-accent [&>td:first-child]:border-l-2 [&>td:first-child]:border-primary"
                  : "hover:bg-muted/50"}`}>
                <td className="px-3 py-3 align-top tabular-nums">{((page ?? 1) - 1) * (pageSize ?? 20) + index + 1}</td>
                <td className="px-3 py-3 align-top">
                  <AssignmentHistoryTime at={row.at} />
                </td>
                <td className="px-3 py-3 align-top">
                  <StatusHistoryValue status={row.fromStatus} />
                </td>
                <td className="px-3 py-3 align-top">
                  <StatusHistoryValue status={row.toStatus} />
                </td>
                <td className="px-3 py-3 align-top">
                  <ConditionValue condition={row.toCondition} />
                </td>
                <td className="px-3 py-3 align-top wrap-anywhere">{row.actorName || "System"}</td>
                <td className="whitespace-pre-wrap px-3 py-3 align-top wrap-anywhere">{row.reason || "—"}</td>
              </tr>
            );
          }) : Array.from({ length: 5 }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {columns.map((column) => (
                <td key={column} className="px-3 py-4">
                  <Skeleton className="h-5 w-full motion-reduce:animate-none" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusHistoryLoading() {
  return (
    <div role="status" aria-label="Loading status history…" className="motion-reduce:[&_*]:animate-none">
      <StatusHistoryTable />
    </div>
  );
}
