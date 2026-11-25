"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ListData } from "../list-page/AssetWorkspaceListPage";
import type { ListUrlState } from "../list-page/useListUrlState";
import { EmptyState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import type { LwTab } from "../../domain/lifecycle-list";
import { LwResults } from "./LwResults";

type Column = { key: string; label: string; className: string };

/** Skeleton shaped like the tab's table (frontend rules: loading matches the loaded page). */
export function LwTableLoading({ columns, label }: { columns: readonly Column[]; label: string }) {
  return (
    <div role="status" aria-label={label} className="motion-reduce:[&_*]:animate-none">
      <table aria-hidden="true" className="w-full min-w-2xl table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`border-b border-border px-3 py-3 font-medium first:pl-4 last:pr-4 ${column.className}`}>
                {column.key === "menu" ? "" : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: 6 }, (_, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key} className={`px-3 py-3 first:pl-4 last:pr-4 ${column.className}`}>
                  <Skeleton className={column.key === "photo" ? "size-10" : column.key === "menu" ? "ml-auto size-6" : "h-4 w-full"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Loading, read error, empty and paged states around a tab's table. */
export function LwListBody<Row>({ tab, url, list, columns, noun, emptyTitle, clear, scrollKey, onRetry, children }: {
  tab: LwTab; url: ListUrlState; list: ListData<Row> | null; columns: readonly Column[]; noun: string;
  emptyTitle: string; clear: Record<string, undefined>; scrollKey: string; onRetry?: () => void; children: (rows: Row[]) => ReactNode;
}) {
  const hasRows = Boolean(list?.rows.length);
  let content: ReactNode;
  if (url.isPending) content = <LwTableLoading columns={columns} label={`Loading ${noun}`} />;
  else if (!list) content = <ErrorState title={`Couldn't load ${noun}`} body="Check your connection, then retry." onRetry={onRetry} />;
  else if (!hasRows && list.total > 0) {
    content = (
      <EmptyState title={`No ${noun} on this page`} body="Go to the first page to see the list." action={(
        <Button variant="outline" onClick={() => url.set({ page: "1" })}>Go to first page</Button>
      )} />
    );
  } else if (!hasRows) {
    const filtered = Object.keys(clear).some((key) => url.get(key));
    content = (
      <EmptyState
        title={filtered ? emptyTitle : `No ${noun} yet`}
        body={filtered ? "Try another search or clear the filters." : "Assets appear here once they are registered."}
        action={filtered ? <Button variant="outline" onClick={() => url.set(clear)}>Clear filters</Button> : undefined}
      />
    );
  } else content = children(list.rows);

  return (
    <LwResults
      tab={tab}
      label={`${noun[0].toUpperCase()}${noun.slice(1)} results`}
      busy={url.isPending}
      scrollKey={scrollKey}
      footer={list && hasRows ? (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          perPage={list.pageSize}
          perPageOptions={[...new Set([10, 25, 50, list.pageSize])].sort((a, b) => a - b)}
          totalItems={list.total}
          rangeStart={(list.page - 1) * list.pageSize + 1}
          rangeEnd={Math.min(list.page * list.pageSize, list.total)}
          itemLabel="assets"
          onPageChange={(value) => url.set({ page: String(value) })}
          onPerPageChange={(value) => url.set({ pageSize: String(value) })}
        />
      ) : undefined}
    >
      {url.isPending || hasRows ? content : <div className="p-4">{content}</div>}
    </LwResults>
  );
}
