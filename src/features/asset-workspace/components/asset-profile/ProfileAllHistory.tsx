"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ActivityIcon, AssignmentIcon, BoxIcon, ClockIcon, EditIcon, FileTextIcon, LocationIcon, ReturnIcon, SearchIcon,
  TransferIcon, WarrantyIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  HISTORY_DATE_RANGES, HISTORY_EVENT_TYPES, historyDateRange, historyEventType, type HistoryDateRange,
} from "../../domain/asset-profile-display.mts";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetHistory } from "../../services/asset-profile-api";
import type { AssetHistoryEvent } from "../../services/asset-profile-contract";
import { AssignmentHistoryTime } from "../assignments/AssignmentsHistoryValues";
import { ProfileAssignmentPager } from "../assignments/ProfileAssignmentPager";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ProfileFilterSelect } from "./ProfileFilterSelect";
import { todayInBangkok } from "./ProfileParts";

const columns = ["Date & Time", "Event Type", "Description", "From", "To", "By", "Notes"];
const widths = ["w-28", "w-36", "", "w-32", "w-32", "w-36", "w-40"];
const EVENT_ICONS = {
  registered: BoxIcon, details: EditIcon, assign: AssignmentIcon, transfer: TransferIcon, return: ReturnIcon,
  location: LocationIcon, status: ClockIcon, files: FileTextIcon, warranty: WarrantyIcon,
} as Record<string, typeof BoxIcon>;

/** Frame 08 All History (FE 03): Core filters and pages; Export is left out (C20). */
export function ProfileAllHistory({ context, assetId }: { context: string; assetId: string }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);
  const [range, setRange] = useState<HistoryDateRange | null>(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const dates = range ? historyDateRange(range, todayInBangkok()) : null;
  const query = { page, q, eventType, dateFrom: dates?.from ?? null, dateTo: dates?.to ?? null };
  const history = useProfileRead(`${context}:${assetId}:history:${JSON.stringify(query)}`,
    (signal) => getAssetHistory(context, assetId, query, signal));
  const result = history.result?.ok ? history.result.data : null;
  const filtered = Boolean(q.trim() || eventType || range);
  function clearFilters() {
    setSearch("");
    setQ("");
    setEventType(null);
    setRange(null);
    setPage(1);
  }

  let results;
  if (!history.result || (history.pending && !result)) {
    results = (
      <div role="status" aria-label="Loading history…" className="motion-reduce:[&_*]:animate-none">
        <HistoryTable />
      </div>
    );
  } else if (!history.result.ok) {
    const code = history.result.code;
    results = (
      <div className="p-4">
        {code === "NOT_FOUND" ? (
          <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
        ) : code === "PERMISSION_DENIED" ? (
          <AccessDeniedState title="You don't have access" body="You don't have permission to view this asset's history." />
        ) : code === "UNAUTHENTICATED" ? (
          <EmptyState title="Sign in required" body="Your session has expired. Sign in again to view this asset." />
        ) : (
          <ErrorState title="Couldn't load history." body="Check your connection and retry." onRetry={history.reload} />
        )}
      </div>
    );
  } else if (result && !result.data.length) {
    results = (
      <div className="p-4">
        {result.total > 0 || result.page > 1 ? (
          <EmptyState title="No history on this page"
            action={<Button variant="outline" onClick={() => setPage(1)}>Go to first page</Button>} />
        ) : filtered ? (
          <EmptyState title="No history matches your filters." body="Change the search or filters."
            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
        ) : (
          <EmptyState title="No history yet." body="Changes to this asset will appear here." />
        )}
      </div>
    );
  } else if (result) {
    results = (
      <>
        <HistoryTable rows={result.data} />
        <ProfileAssignmentPager page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages}
          itemLabel={result.total === 1 ? "history record" : "history records"} onPageChange={setPage} />
      </>
    );
  }

  return (
    <Card className="@container/all-history min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={history.pending}>
      <div className="grid min-w-0 grid-cols-1 gap-2 px-4 py-3 @2xl/all-history:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div role="search" className="relative min-w-0">
          <label htmlFor="profile-history-search" className="sr-only">Search history</label>
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input id="profile-history-search" type="search" maxLength={200} value={search} placeholder="Search history..."
            className="h-10 pl-9 md:text-xs" onChange={(event) => setSearch(event.target.value)} />
        </div>
        <ProfileFilterSelect label="Event Type" value={eventType} options={HISTORY_EVENT_TYPES}
          onChange={(value) => { setEventType(value); setPage(1); }} />
        <ProfileFilterSelect label="Date Range" value={range} options={HISTORY_DATE_RANGES}
          onChange={(value) => { setRange(value as HistoryDateRange | null); setPage(1); }} />
      </div>
      {results}
    </Card>
  );
}

function HistoryTable({ rows }: { rows?: AssetHistoryEvent[] }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-3xl table-fixed text-left text-xs">
        <caption className="sr-only">Asset history</caption>
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
          {rows ? rows.map((row) => {
            const type = historyEventType(row.eventType);
            const Icon = EVENT_ICONS[row.eventType] ?? ActivityIcon;
            return (
              <tr key={row.id} className="hover:bg-muted/50">
                <td className="px-3 py-3 align-top">
                  <AssignmentHistoryTime at={row.at} />
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <Badge color={type.tone} variant="pill">{type.label}</Badge>
                  </span>
                </td>
                <td className="px-3 py-3 align-top wrap-anywhere">{row.summary || "—"}</td>
                <td className="px-3 py-3 align-top wrap-anywhere">{row.from || "—"}</td>
                <td className="px-3 py-3 align-top wrap-anywhere">{row.to || "—"}</td>
                <td className="px-3 py-3 align-top">
                  {row.actorName ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={row.actorName} size={24} />
                      <span title={row.actorName} className="min-w-0 truncate">{row.actorName}</span>
                    </span>
                  ) : "System"}
                </td>
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
