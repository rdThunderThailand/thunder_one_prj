"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { CheckCircleIcon, SearchIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/lovable/input";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/lovable/tabs";
import type { AssetImportApi } from "../../services/asset-import-api";
import type {
  ImportBatch,
  RowResult,
  Severity,
} from "../../domain/asset-import-types";
import { formatCount } from "../../domain/asset-import-format";
import { useAssetImportBatch } from "../../hooks/use-asset-import-batch";
import { useAssetImportRows } from "../../hooks/use-asset-import-rows";
import { ErrorState } from "../states/ErrorState";
import { BulkImportPagination } from "./BulkImportPagination";
import { BulkImportRowsGrid } from "./BulkImportRowsGrid";
import { BulkImportRowsEmpty } from "./BulkImportRowsEmpty";
import { BulkImportRowDetails } from "./BulkImportRowDetails";
import { BulkImportRowsLoading } from "./BulkImportRowsLoading";

type Tab = "all" | Severity | RowResult;

type Props = {
  api: AssetImportApi;
  batchId: string;
  variant: "validate" | "review" | "result";
  initialTab?: Tab;
  batch?: ImportBatch;
  toolbar?: ReactNode;
  onReloadBatch?: () => void;
  onReimport?: () => void;
  reimporting?: boolean;
};

export function BulkImportRowsTable({
  api,
  batchId,
  variant,
  initialTab = "all",
  batch,
  toolbar,
  onReloadBatch,
  onReimport,
  reimporting,
}: Props) {
  const [query, setQuery] = useState({
    tab: initialTab,
    q: "",
    page: 1,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const searchId = useId();
  const batchResource = useAssetImportBatch(api, batch ? null : batchId);
  const currentBatch = batch ?? batchResource.batch;
  const result = variant === "result";
  const validate = variant === "validate";
  const fill = variant === "review" && "flex flex-1 flex-col";
  const rows = useAssetImportRows(api, batchId, {
    page: query.page,
    pageSize: query.pageSize,
    q: query.q || undefined,
    ...(query.tab !== "all" &&
      (result
        ? { result: query.tab as RowResult }
        : { severity: query.tab as Severity })),
  }, {
    onResetPage: () => setQuery((previous) => ({ ...previous, page: 1 })),
    onBatchUnavailable: onReloadBatch,
  });

  useEffect(() => {
    if (search.trim() === query.q) return;
    const timer = setTimeout(
      () =>
        setQuery((previous) => ({
          ...previous,
          q: search.trim(),
          page: 1,
        })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, query.q]);

  const viewPosition = viewIndex === null ? 0 : (query.page - 1) * query.pageSize + viewIndex;
  function stepRow(delta: 1 | -1) {
    if (viewIndex === null || !rows.page) return;
    const next = viewIndex + delta;
    if (next >= 0 && next < rows.page.rows.length) { setViewIndex(next); return; }
    setQuery((previous) => ({ ...previous, page: previous.page + delta }));
    setViewIndex(delta > 0 ? 0 : query.pageSize - 1);
  }

  const counts = currentBatch?.counts;
  const tabs: { key: Tab; label: string; count?: number; icon?: ReactNode }[] = result
    ? [
        { key: "all", label: "All Rows", count: currentBatch?.totalRows },
        { key: "created", label: "Created", count: counts?.created, icon: <CheckCircleIcon className="size-4 text-success" /> },
        { key: "created_with_warning", label: "Created with Warnings", count: counts?.createdWithWarning, icon: <WarningTriangleIcon className="size-4 text-warning" /> },
        { key: "not_registered", label: "Not Registered", count: counts?.notRegistered, icon: <XCircleIcon className="size-4 text-error" /> },
      ]
    : [
        { key: "all", label: "All", count: currentBatch?.totalRows },
        { key: "valid", label: "Valid", count: counts?.valid, icon: <CheckCircleIcon className="size-4 text-success" /> },
        { key: "warning", label: "Warnings", count: counts?.warning, icon: <WarningTriangleIcon className="size-4 text-warning" /> },
        { key: "error", label: "Errors", count: counts?.error, icon: <XCircleIcon className="size-4 text-error" /> },
      ];

  return (
    <div
      className={cn("min-w-0", fill)}
      aria-busy={rows.loading || batchResource.loading}
    >
      <Tabs
        className={cn("min-w-0", fill)}
        value={query.tab}
        onValueChange={(tab) =>
          setQuery((previous) => ({
            ...previous,
            tab: tab as Tab,
            page: 1,
          }))
        }
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <TabsList
            className={cn(
              "h-auto max-w-full flex-wrap justify-start gap-1 bg-muted p-1",
              validate && "w-full basis-full",
            )}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={cn(
                  "min-h-8 gap-1 whitespace-normal text-2xs sm:text-xs",
                  validate && "flex-1",
                )}
              >
                {tab.icon}
                {tab.label} (
                {tab.count === undefined ? "…" : formatCount(tab.count)})
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative min-w-0 flex-1 basis-52">
            <label htmlFor={searchId} className="sr-only">
              Search import rows
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchId}
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-9 text-xs"
              placeholder={
                result
                  ? "Search by row number, asset name, error message…"
                  : variant === "review"
                    ? "Search by asset name, asset tag, serial number…"
                    : "Search by row number, asset name, issue…"
              }
            />
          </div>
          {toolbar}
        </div>
        <TabsContent
          value={query.tab}
          className={cn("mt-3 space-y-3", fill)}
        >
          {rows.loading || batchResource.loading ? (
            <BulkImportRowsLoading variant={variant} />
          ) : rows.error ? (
            <ErrorState
              title="Couldn’t load import rows"
              body={rows.error.message}
              onRetry={
                rows.error.status === 404 && onReloadBatch
                  ? onReloadBatch
                  : rows.reload
              }
            />
          ) : batchResource.error ? (
            <ErrorState
              body={batchResource.error.message}
              onRetry={batchResource.reload}
            />
          ) : (
            rows.page && (
              <>
                {rows.page.rows.length ? (
                  <BulkImportRowsGrid
                    rows={rows.page.rows}
                    variant={variant}
                    onViewRow={(row) => setViewIndex(rows.page?.rows.indexOf(row) ?? null)}
                  />
                ) : (
                  <BulkImportRowsEmpty tab={query.tab} searching={Boolean(query.q)} />
                )}
                <BulkImportPagination
                  data={rows.page}
                  pending={rows.loading}
                  onPage={(page) =>
                    setQuery((previous) => ({ ...previous, page }))
                  }
                  onPageSize={(pageSize) =>
                    setQuery((previous) => ({
                      ...previous,
                      pageSize,
                      page: 1,
                    }))
                  }
                />
              </>
            )
          )}
        </TabsContent>
      </Tabs>
      {viewIndex !== null && (
        <BulkImportRowDetails
          row={rows.page?.rows[viewIndex] ?? null}
          batch={currentBatch ?? undefined}
          position={rows.page ? { index: viewPosition + 1, total: rows.page.total } : undefined}
          loading={rows.loading}
          error={rows.error?.message}
          canPrevious={Boolean(rows.page) && viewPosition > 0}
          canNext={Boolean(rows.page) && viewPosition + 1 < (rows.page?.total ?? 0)}
          onStep={stepRow}
          onRetry={rows.reload}
          onClose={() => setViewIndex(null)}
          onReimport={onReimport}
          reimporting={reimporting}
        />
      )}
    </div>
  );
}
