"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProfileReadResult } from "../../services/asset-profile-api";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";

/** FE 09–10 (File History, Audit Log): the table, row and state pieces copied from Status History / All History. */

/** Typed text, and the value Core gets 300 ms after typing stops (as All History). */
export function useHistorySearch(onSettled: () => void) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(search);
      onSettled();
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSettled only resets the page
  }, [search]);
  return { search, setSearch, q, clear: () => { setSearch(""); setQ(""); } };
}

export function HistorySearch({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div role="search" className="relative min-w-0">
      <label htmlFor={id} className="sr-only">{label}</label>
      <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
      <Input id={id} type="search" maxLength={200} value={value} placeholder={`${label}…`}
        className="h-10 pl-9 md:text-xs" onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function HistoryActor({ name }: { name: string | null }) {
  if (!name) return <span>System</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={name} size={24} />
      <span title={name} className="min-w-0 truncate">{name}</span>
    </span>
  );
}

export function HistoryTabTable({ caption, columns, widths, minWidth, children }: {
  caption: string; columns: readonly string[]; widths: readonly string[]; minWidth: string; children?: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className={`relative w-full ${minWidth} table-fixed text-left text-xs`}>
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {widths.map((width, index) => <col key={columns[index]} className={width} />)}
        </colgroup>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((heading, index) => (
              <th key={heading} scope="col" aria-sort={index === 1 ? "descending" : undefined}
                className="border-b border-border px-3 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {children ?? Array.from({ length: 5 }, (_, index) => (
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

/** Click, Enter or Space opens the detail panel; the selected row keeps the Status History highlight. */
export function HistoryTabRow({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <tr tabIndex={0} aria-selected={selected} onClick={onSelect}
      onKeyDown={(press) => {
        if (press.target !== press.currentTarget || (press.key !== "Enter" && press.key !== " ")) return;
        press.preventDefault();
        onSelect();
      }}
      className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected
        ? "bg-accent [&>td:first-child]:border-l-2 [&>td:first-child]:border-primary"
        : "hover:bg-muted/50"}`}>
      {children}
    </tr>
  );
}

/** Loading, error and empty states for one history read; `null` when there are rows to show. */
export function historyTabState<T extends { data: unknown[]; total: number; page: number }>(read: {
  result: ProfileReadResult<T> | null; pending: boolean; reload: () => void;
}, text: { loading: string; table: ReactNode; noun: string; empty: string; filtered: boolean; onClear: () => void; onFirstPage: () => void }) {
  const result = read.result?.ok ? read.result.data : null;
  if (!read.result || (read.pending && !result)) {
    return (
      <div role="status" aria-label={text.loading} className="motion-reduce:[&_*]:animate-none">
        {text.table}
      </div>
    );
  }
  if (!read.result.ok) {
    const code = read.result.code;
    return (
      <div className="p-4">
        {code === "NOT_FOUND" ? (
          <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
        ) : code === "PERMISSION_DENIED" ? (
          <AccessDeniedState title="You don't have access" body={`You don't have permission to view this asset's ${text.noun}.`} />
        ) : code === "UNAUTHENTICATED" ? (
          <EmptyState title="Sign in required" body="Your session has expired. Sign in again to view this asset." />
        ) : (
          <ErrorState title={`Couldn't load ${text.noun}`} body="Check your connection and retry." onRetry={read.reload} />
        )}
      </div>
    );
  }
  if (result && !result.data.length) {
    return (
      <div className="p-4">
        {result.total > 0 || result.page > 1 ? (
          <EmptyState title="No records on this page"
            action={<Button variant="outline" onClick={text.onFirstPage}>Go to first page</Button>} />
        ) : text.filtered ? (
          <EmptyState title="No records match these filters." body="Change the search or filters."
            action={<Button variant="outline" onClick={text.onClear}>Clear filters</Button>} />
        ) : (
          <EmptyState title={text.empty} />
        )}
      </div>
    );
  }
  return null;
}

export function PanelField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="wrap-anywhere">{children}</dd>
    </div>
  );
}
