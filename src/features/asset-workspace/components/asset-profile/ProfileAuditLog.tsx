"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ShieldIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { HISTORY_DATE_RANGES, historyDateRange, type HistoryDateRange } from "../../domain/asset-profile-display.mts";
import { assignmentHistoryDate } from "../../domain/assignment-history";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { AUDIT_ACTIONS, getAssetAuditLog, type AssetAuditEvent } from "../../services/asset-history-tabs-api";
import { ProfileAssignmentPager } from "../assignments/ProfileAssignmentPager";
import { AccessDeniedState } from "../states/states";
import { ProfileFilterSelect } from "./ProfileFilterSelect";
import {
  HistoryActor, HistorySearch, HistoryTabRow, HistoryTabTable, historyTabState, PanelField, useHistorySearch,
} from "./ProfileHistoryTabParts";
import { ConditionValue, todayInBangkok } from "./ProfileParts";
import { StatusHistoryValue } from "./ProfileStatusHistoryPanel";

const columns = ["#", "Date & Time", "Action", "Field / Object", "Before", "After", "Performed By", "Source"];
const widths = ["w-8", "w-24", "w-24", "w-24", "", "", "", "w-14"];
const ACTION_OPTIONS = AUDIT_ACTIONS.map((id) => ({ id, label: id.toUpperCase() }));
// ADR 0098 map: additions success, removal error, every other change info.
const ACTION_TONE = { create: "green", file_add: "green", warranty_add: "green", file_remove: "red" } as Record<string, "green" | "red">;
const SOURCE = { web: "Web", system: "System" } as const;
const when = (at: string) => { const value = assignmentHistoryDate(at); return `${value.date} ${value.time}`; };

function ActionBadge({ action }: { action: string }) {
  return <Badge color={ACTION_TONE[action] ?? "blue"} variant="pill">{action.toUpperCase()}</Badge>;
}

/** Status and Condition keep their badge colours; any other value is plain text, "—" when empty. */
function ChangeValue({ field, value }: { field: string; value: string | null }) {
  if (field === "Status") return <StatusHistoryValue status={value} />;
  if (field === "Condition" && value) return <ConditionValue condition={value} />;
  return <span className="wrap-anywhere">{value || "—"}</span>;
}

/** Frame 14 Audit Log (FE 10): manager or above; JSON, IP, browser and Export are left out (owner). */
export function ProfileAuditLog({ context, assetId, enabled, layout }: {
  context: string; assetId: string; enabled: boolean;
  layout: (content: ReactNode, panel: ReactNode) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);
  const [range, setRange] = useState<HistoryDateRange | null>(null);
  // undefined: first row of the page; null: panel closed.
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const search = useHistorySearch(() => goToPage(1));
  const dates = range ? historyDateRange(range, todayInBangkok()) : null;
  const query = { page, q: search.q, action, actorId, dateFrom: dates?.from ?? null, dateTo: dates?.to ?? null };
  const log = useProfileRead(`${context}:${assetId}:audit-log:${JSON.stringify(query)}`,
    (signal) => getAssetAuditLog(context, assetId, query, signal), enabled);

  if (!enabled) return layout(null, null);
  const result = log.result?.ok ? log.result.data : null;
  const selected = selectedId === null ? null : result?.data.find((row) => row.id === selectedId) ?? result?.data[0] ?? null;
  function goToPage(next: number) {
    setPage(next);
    setSelectedId(undefined);
  }
  function filter<T extends string>(set: (value: T | null) => void) {
    return (value: string | null) => { set(value as T | null); goToPage(1); };
  }
  const header = (
    <div className="flex items-start gap-2 px-4 pt-3">
      <ShieldIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        <h2 className="text-sm font-semibold">Audit Log</h2>
        <p className="text-xs text-muted-foreground">Complete audit trail of changes and activity for this asset. (Immutable record)</p>
      </div>
    </div>
  );

  // Below manager: one note, no filters or table (owner Q4).
  if (log.result && !log.result.ok && log.result.code === "PERMISSION_DENIED") {
    return layout(
      <Card className="min-w-0 p-0">
        {header}
        <div className="p-4">
          <AccessDeniedState title="You don't have access to the audit log." body="Only managers and admins can view it." />
        </div>
      </Card>,
      null,
    );
  }

  const results = historyTabState(log, {
    loading: "Loading audit log…", table: <HistoryTabTable caption="Audit log" columns={columns} widths={widths} minWidth="min-w-xl" />,
    noun: "audit log", empty: "No audit events yet.", filtered: Boolean(search.q.trim() || action || actorId || range),
    onClear: () => { search.clear(); setAction(null); setActorId(null); setRange(null); goToPage(1); },
    onFirstPage: () => goToPage(1),
  }) ?? (result && (
    <div className="flex min-h-64 flex-1 flex-col justify-between">
      <HistoryTabTable caption="Audit log" columns={columns} widths={widths} minWidth="min-w-xl">
        {result.data.map((row, index) => {
          const [first] = row.changes;
          return (
            <HistoryTabRow key={row.id} selected={row.id === selected?.id} onSelect={() => setSelectedId(row.id)}>
              <td className="px-3 py-3 align-top tabular-nums">{(result.page - 1) * result.pageSize + index + 1}</td>
              <td className="px-3 py-3 align-top tabular-nums">{when(row.at)}</td>
              <td className="px-3 py-3 align-top">
                <ActionBadge action={row.action} />
              </td>
              <td className="px-3 py-3 align-top wrap-anywhere">
                {first?.field ?? row.summary ?? "—"}
                {row.changes.length > 1 && <span className="block text-2xs text-muted-foreground">+{row.changes.length - 1} more</span>}
              </td>
              <td className="px-3 py-3 align-top">
                {first ? <ChangeValue field={first.field} value={first.before} /> : "—"}
              </td>
              <td className="px-3 py-3 align-top">
                {first ? <ChangeValue field={first.field} value={first.after} /> : "—"}
              </td>
              <td className="px-3 py-3 align-top">
                <HistoryActor name={row.actorName} />
              </td>
              <td className="px-3 py-3 align-top">{SOURCE[row.source]}</td>
            </HistoryTabRow>
          );
        })}
      </HistoryTabTable>
      <ProfileAssignmentPager page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages}
        itemLabel={result.total === 1 ? "record" : "records"} onPageChange={goToPage} />
    </div>
  ));

  const content = (
    <Card className="@container/audit-log min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={log.pending}>
      {header}
      <div className="grid min-w-0 grid-cols-1 gap-2 px-4 py-3 @md/audit-log:grid-cols-2 @4xl/audit-log:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <HistorySearch id="profile-audit-log-search" label="Search audit log" value={search.search} onChange={search.setSearch} />
        <ProfileFilterSelect label="Action" value={action} options={ACTION_OPTIONS} onChange={filter(setAction)} />
        <ProfileFilterSelect label="User" value={actorId}
          options={(result?.actors ?? []).map(({ id, name }) => ({ id, label: name }))} onChange={filter(setActorId)} />
        <ProfileFilterSelect label="Date Range" value={range} options={HISTORY_DATE_RANGES} onChange={filter<HistoryDateRange>(setRange)} />
      </div>
      {results}
    </Card>
  );
  return layout(content, selected ? <AuditLogPanel row={selected} onClose={() => setSelectedId(null)} /> : null);
}

function AuditLogPanel({ row, onClose }: { row: AssetAuditEvent; onClose: () => void }) {
  return (
    <Card role="complementary" aria-label="Audit Log Detail"
      className="min-w-0 space-y-4 overscroll-contain p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ShieldIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 truncate">Audit Log Detail</span>
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close audit log detail" onClick={onClose}>
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionBadge action={row.action} />
        <time dateTime={row.at} className="tabular-nums text-muted-foreground">{when(row.at)}</time>
      </div>
      {row.summary && <p className="wrap-anywhere">{row.summary}</p>}
      <section className="space-y-2">
        <h3 className="text-muted-foreground">Fields Changed</h3>
        {row.changes.length ? (
          <ul className="space-y-3">
            {row.changes.map((change) => (
              <li key={change.field} className="space-y-1">
                <p className="font-semibold">{change.field}</p>
                <p className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                  <ChangeValue field={change.field} value={change.before} />
                  <ArrowRightIcon aria-label="changed to" className="mt-0.5 size-4 text-muted-foreground" />
                  <ChangeValue field={change.field} value={change.after} />
                </p>
              </li>
            ))}
          </ul>
        ) : <p>—</p>}
      </section>
      <dl className="space-y-3 border-t border-border pt-3">
        <PanelField label="Performed By">
          <HistoryActor name={row.actorName} />
        </PanelField>
        <PanelField label="Source">{SOURCE[row.source]}</PanelField>
        <PanelField label="Reason / Notes">
          <span className="block whitespace-pre-wrap rounded-control bg-muted/60 p-3">{row.reason || "—"}</span>
        </PanelField>
      </dl>
    </Card>
  );
}
