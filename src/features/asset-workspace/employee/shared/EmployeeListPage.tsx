"use client";

// The employee list screen (My Assets, My Tasks). The shared `AssetWorkspaceListPage` stays untouched (senior rule);
// this adds what the employee lists need: the results fill the page height and scroll inside (design/layout-scroll.md,
// fit measured like CategoriesWorkspace), tabs with counts and whole-row links (PO employee mock 02 and 04).
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { ListColumn, ListData } from "../../components/list-page/AssetWorkspaceListPage";
import { useListUrlState, type ListUrlState } from "../../components/list-page/useListUrlState";
import { ErrorState } from "../../components/states/ErrorState";
import { EmptyState } from "../../components/states/states";

export interface ListTab {
  key: string;
  label: string;
  /** `null` = the count read failed; the tab shows no number. */
  count?: number | null;
}

/** Bounds the workspace to the space under it while at least 160px of rows fit; otherwise normal page flow. */
function useFitHeight() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const workspace = ref.current;
    const main = workspace?.closest("main");
    if (!workspace || !main) return;
    function fit() {
      if (!workspace || !main) return;
      const top = workspace.getBoundingClientRect().top + main.scrollTop + window.scrollY;
      const bottomPadding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const height = Math.floor((window.visualViewport?.height ?? window.innerHeight) - top - bottomPadding);
      const blocks = Array.from(workspace.children) as HTMLElement[];
      const fixed = blocks.filter((block) => !block.hasAttribute("data-list-results")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const gap = Number.parseFloat(getComputedStyle(workspace).rowGap) || 0;
      const controls = Array.from(workspace.querySelectorAll<HTMLElement>("[data-list-controls]")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const bounded = height - fixed - gap * Math.max(0, blocks.length - 1) - controls >= 160;
      const entering = bounded && workspace.dataset.bounded !== "true";
      workspace.style.setProperty("--employee-list-height", `${Math.max(0, height)}px`);
      workspace.dataset.bounded = String(bounded);
      if (entering) main.scrollTop = 0;
    }
    const observer = new ResizeObserver(fit);
    observer.observe(main);
    observer.observe(workspace);
    function observeBlocks() {
      if (!workspace) return;
      for (const block of workspace.children) observer.observe(block);
      for (const control of workspace.querySelectorAll("[data-list-controls]")) observer.observe(control);
      fit();
    }
    observeBlocks();
    const mutations = new MutationObserver(observeBlocks);
    mutations.observe(workspace, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);
  return ref;
}

export function EmployeeListPage<Row>({
  title,
  subtitle,
  tabs,
  tabParam = "tab",
  filters,
  columns,
  data,
  getRowId,
  rowHref,
  rowLabel,
  itemLabel,
  emptyTitle,
  emptyBody,
  loading = false,
  thumbnails = false,
}: {
  title: string;
  subtitle?: string;
  tabs?: ListTab[];
  /** URL key the tabs write; the first tab clears it. */
  tabParam?: string;
  filters?: (url: ListUrlState) => ReactNode;
  columns: ListColumn<Row>[];
  /** `null` = the read failed → ErrorState with Retry. */
  data: ListData<Row> | null;
  getRowId: (row: Row) => string;
  /** Clicking anywhere on a row opens this; the row's own link keeps keyboard access. */
  rowHref: (row: Row) => string;
  rowLabel: (row: Row) => string;
  itemLabel: string;
  emptyTitle: string;
  emptyBody: string;
  /** Route loading screen: real header, tabs and column titles; skeleton counts, rows and pager. */
  loading?: boolean;
  /** The first column starts with a thumbnail; the row skeleton copies it. */
  thumbnails?: boolean;
}) {
  const ref = useFitHeight();
  const url = useListUrlState();
  const router = useRouter();
  const activeTab = url.get(tabParam) ?? tabs?.[0]?.key;
  const rows = data?.rows ?? [];
  const busy = loading || url.isPending;

  return (
    // Same side and top padding as the other employee pages; no bottom padding, so the fit counts `main`'s only.
    <div className="px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        ref={ref}
        className="group/employee-list flex min-w-0 flex-col gap-4 [&>*]:shrink-0 data-[bounded=true]:h-(--employee-list-height) data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden"
      >
        <PageHeader
          title={title}
          subtitle={subtitle}
        />
        {tabs && tabs.length > 0 && (
          <Tabs
            variant="underline"
            activationMode="manual"
            value={activeTab}
            onValueChange={(key) => url.set({ [tabParam]: key === tabs[0].key ? undefined : key })}
          >
            <TabsList
              aria-label={`${title} views`}
              className="max-w-full overflow-x-auto"
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="whitespace-nowrap"
                >
                  {tab.label}
                  {loading ? (
                    <Skeleton className="ml-1.5 h-4 w-5 rounded-full" />
                  ) : tab.count != null && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {tab.count.toLocaleString()}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {filters && <div className="flex flex-wrap items-center gap-2">{filters(url)}</div>}
        <Card
          data-list-results
          className="flex min-w-0 flex-col overflow-hidden p-0 group-data-[bounded=true]/employee-list:min-h-0 group-data-[bounded=true]/employee-list:flex-1 group-data-[bounded=true]/employee-list:shrink"
        >
          {busy ? (
            <ListLoading
              columns={columns}
              thumbnails={thumbnails}
            />
          ) : data === null ? (
            <div className="grid flex-1 place-items-center p-4 *:w-full">
              <ErrorState />
            </div>
          ) : rows.length === 0 ? (
            <div className="grid flex-1 place-items-center p-4 *:w-full">
              <EmptyState
                title={emptyTitle}
                body={emptyBody}
              />
            </div>
          ) : (
            <>
              <div
                className="relative min-w-0 overflow-x-auto overscroll-contain group-data-[bounded=true]/employee-list:min-h-0 group-data-[bounded=true]/employee-list:flex-1 group-data-[bounded=true]/employee-list:overflow-auto"
              >
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-4 py-3 font-medium ${column.className ?? ""}`}
                        >
                          {column.header}
                        </th>
                      ))}
                      <th className="w-10 px-2 py-3">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={getRowId(row)}
                        onClick={(event) => {
                          if ((event.target as HTMLElement).closest("a,button")) return;
                          router.push(rowHref(row));
                        }}
                        className="group/row cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/60"
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`relative px-4 py-3 ${column.className ?? ""}`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                        <td className="relative px-2 py-3 text-muted-foreground">
                          <ChevronRightIcon
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground"
                          />
                          <span className="sr-only">Open {rowLabel(row)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                data-list-controls
                className="border-t border-border px-4 py-1"
              >
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
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Same table frame and column titles as the loaded list, so nothing jumps when rows arrive. */
function ListLoading<Row>({ columns, thumbnails }: { columns: ListColumn<Row>[]; thumbnails: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-0 flex-1 flex-col motion-reduce:[&_.animate-pulse]:animate-none"
    >
      <div className="min-w-0 overflow-hidden group-data-[bounded=true]/employee-list:min-h-0 group-data-[bounded=true]/employee-list:flex-1">
        <table
          aria-hidden="true"
          className="w-full text-left text-sm"
        >
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, index) => (
              <tr
                key={index}
                className="border-b border-border last:border-0"
              >
                {columns.map((column, col) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className ?? ""}`}
                  >
                    {col === 0 ? (
                      <div className="flex items-center gap-3">
                        {thumbnails && <Skeleton className="size-10 shrink-0 rounded-md" />}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-3/4 max-w-48" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-full max-w-24" />
                    )}
                  </td>
                ))}
                <td className="px-2 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        data-list-controls
        aria-hidden="true"
        className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
      >
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-8 w-48 max-w-full" />
      </div>
    </div>
  );
}
