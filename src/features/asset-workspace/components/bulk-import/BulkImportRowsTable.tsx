"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/lovable/tabs";
import type { AssetImportApi } from "../../services/asset-import-api";
import type {
  ImportBatch,
  ImportRow,
  RowResult,
  Severity,
} from "../../domain/asset-import-types";
import { useAssetImportBatch } from "../../hooks/use-asset-import-batch";
import { useAssetImportRows, useImportRowsSearch } from "../../hooks/use-asset-import-rows";
import { useImportEditorResources } from "../../hooks/use-import-editor-resources";
import { ErrorState } from "../states/ErrorState";
import { BulkImportPagination } from "./BulkImportPagination";
import { BulkImportRowsGrid } from "./BulkImportRowsGrid";
import { BulkImportRowsEmpty } from "./BulkImportRowsEmpty";
import { BulkImportRowDetails } from "./BulkImportRowDetails";
import { BulkImportRowsLoading } from "./BulkImportRowsLoading";

import { BulkImportRowsToolbar, importRowsTabs } from "./BulkImportRowsToolbar";
import { BulkImportRowEditor, type ImportEditorContext } from "./BulkImportRowEditor";

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
  editor?: ImportEditorContext;
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
  reimporting, editor,
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
  const [editRow, setEditRow] = useState<ImportRow | null>(null);
  const [editFirst, setEditFirst] = useState(true);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const resources = useImportEditorResources(api, batchId, editor?.context ?? "");
  function openEditor(row: ImportRow, editing: boolean) {
    // The kept rows are older than the table: read them again.
    if (resources.rows.get()?.some((kept) => kept.id === row.id && kept.version !== row.version)) resources.rows.clear();
    setTrigger(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setEditFirst(editing);
    setEditRow(row);
  }
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

  useImportRowsSearch(search, query.q, (q) => setQuery((previous) => ({ ...previous, q, page: 1 })));

  const viewPosition = viewIndex === null ? 0 : (query.page - 1) * query.pageSize + viewIndex;
  function stepRow(delta: 1 | -1) {
    if (viewIndex === null || !rows.page) return;
    const next = viewIndex + delta;
    if (next >= 0 && next < rows.page.rows.length) { setViewIndex(next); return; }
    setQuery((previous) => ({ ...previous, page: previous.page + delta }));
    setViewIndex(delta > 0 ? 0 : query.pageSize - 1);
  }

  const tabs = importRowsTabs(currentBatch, result);

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
        <BulkImportRowsToolbar {...{ tabs, validate, result, variant, searchId, search, setSearch, toolbar }} />
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
                  : () => { resources.stop(); rows.reload(); }
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
                    onViewRow={(row) => editor && currentBatch ? openEditor(row, false) : setViewIndex(rows.page?.rows.indexOf(row) ?? null)}
                    onEditRow={editor && currentBatch?.status === "validated" && !editor.disabled
                      ? (row) => openEditor(row, true) : undefined}
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
      {editRow && editor && currentBatch && (
        <BulkImportRowEditor key={editRow.id} api={api} batch={currentBatch} row={editRow} resources={resources} initialEditing={editFirst}
          editor={{ ...editor, onSaved: (result) => { rows.replace(result); editor.onSaved(result); } }}
          onClose={() => setEditRow(null)} onReloadBatch={onReloadBatch}
          returnFocus={() => { if (trigger?.isConnected) trigger.focus(); else document.getElementById(searchId)?.focus(); }} />
      )}
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
