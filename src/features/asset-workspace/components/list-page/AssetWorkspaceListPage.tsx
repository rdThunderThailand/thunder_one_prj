"use client";

// The one list screen every Asset Workspace page stands on (P1-07): Assets,
// Assignments, Inventory Sessions, Locations. The server page fetches rows from
// the URL's filters and passes them in; this component owns header, stat tiles,
// tabs, selection + bulk bar, side panel, pagination and every state.
// `columns` and the render props are functions, which a Server Component cannot pass
// to a Client one: each screen is a server page that fetches, plus a small "use client"
// view that declares its columns and renders this.
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { Tabs } from "@/components/ui/Tabs";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { useListUrlState, type ListUrlState } from "./useListUrlState";

export interface ListColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
}

export interface ListData<Row> {
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ListStat {
  label: string;
  value: string;
  hint?: string;
}

interface AssetWorkspaceListPageProps<Row> {
  title: string;
  subtitle?: string;
  primaryAction?: ReactNode;
  stats?: ListStat[];
  tabs?: { key: string; label: string }[];
  /** Filter controls. They get the scaffold's own URL state: a second `useListUrlState()`
   *  would not tell the scaffold a navigation is pending, so Loading would never show. */
  filters?: (url: ListUrlState) => ReactNode;
  columns: ListColumn<Row>[];
  /** `null` means the fetch failed (the adapters' convention) → ErrorState with Retry. */
  data: ListData<Row> | null;
  getRowId: (row: Row) => string;
  itemLabel: string;
  emptyTitle?: string;
  emptyBody?: string;
  /** Rendered only while rows are selected. */
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  /** Row click opens this in a right-side panel. */
  renderPanel?: (row: Row) => ReactNode;
  panelTitle?: (row: Row) => string;
}

export function AssetWorkspaceListPage<Row>({
  title,
  subtitle,
  primaryAction,
  stats,
  tabs,
  filters,
  columns,
  data,
  getRowId,
  itemLabel,
  emptyTitle,
  emptyBody,
  bulkActions,
  renderPanel,
  panelTitle,
}: AssetWorkspaceListPageProps<Row>) {
  const url = useListUrlState();
  // ponytail: selection is per page — it is filtered to the rows on screen, so paging or
  // filtering drops it. Cross-page selection when bulk actions need it.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = data?.rows ?? [];
  const selectedIds = rows.map(getRowId).filter((id) => selected.has(id));
  const openRow = renderPanel ? rows.find((row) => getRowId(row) === openId) : undefined;
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rows.map(getRowId)) : new Set());
  }

  const showSelection = bulkActions !== undefined;

  return (
    <div className="space-y-3 p-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={primaryAction}
      />

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatTile
              key={stat.label}
              {...stat}
            />
          ))}
        </div>
      )}

      {tabs && (
        <Tabs
          items={tabs.map((tab) => ({ ...tab, content: null }))}
          activeKey={url.get("tab") ?? tabs[0]?.key}
          onChange={(key) => url.set({ tab: key })}
        />
      )}

      {filters && <div className="flex flex-wrap items-center gap-2">{filters(url)}</div>}

      {showSelection && selectedIds.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-info-muted px-4 py-2 text-sm"
        >
          <span className="font-medium text-foreground">{selectedIds.length} selected</span>
          {bulkActions(selectedIds, () => setSelected(new Set()))}
        </div>
      )}

      <Card className="p-4">
        {url.isPending ? (
          <LoadingState />
        ) : data === null ? (
          <ErrorState />
        ) : rows.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            body={emptyBody}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    {showSelection && (
                      <th className="w-10 py-2">
                        <Checkbox
                          aria-label="Select all rows"
                          checked={allSelected ? true : selectedIds.length > 0 ? "indeterminate" : false}
                          onCheckedChange={(checked) => toggleAll(checked === true)}
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`py-2 pr-4 font-medium ${column.className ?? ""}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = getRowId(row);
                    return (
                      <tr
                        key={id}
                        onClick={renderPanel ? () => setOpenId(id) : undefined}
                        className={`border-b border-border last:border-0 ${renderPanel ? "cursor-pointer hover:bg-muted" : ""}`}
                      >
                        {showSelection && (
                          <td
                            className="py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Checkbox
                              aria-label={`Select row ${id}`}
                              checked={selected.has(id)}
                              onCheckedChange={(checked) => toggle(id, checked === true)}
                            />
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`py-3 pr-4 ${column.className ?? ""}`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              perPage={data.pageSize}
              totalItems={data.total}
              rangeStart={(data.page - 1) * data.pageSize + 1}
              rangeEnd={Math.min(data.page * data.pageSize, data.total)}
              itemLabel={itemLabel}
              onPageChange={(page) => url.set({ page: String(page) })}
              onPerPageChange={(size) => url.set({ pageSize: String(size) })}
            />
          </>
        )}
      </Card>

      <Sheet
        open={openRow !== undefined}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{openRow && panelTitle ? panelTitle(openRow) : title}</SheetTitle>
          </SheetHeader>
          {openRow && renderPanel?.(openRow)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
