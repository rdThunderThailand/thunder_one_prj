"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchContentFolders } from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";
import type { CompositionLibraryAction } from "../library-actions";
import { DEFAULT_STATE, readListState, writeListState, type ListFilters, type SortKey } from "../list-url-state";
import { fetchCompositionLibrary, restoreComposition, setCompositionStatus } from "../services/compositions-api";
import type { CompositionLibraryItem, CompositionLibraryPage } from "../types";
import { CompositionLibraryDialogs, type CompositionDialogAction } from "./CompositionLibraryDialogs";
import { CompositionFolderRail } from "./CompositionFolderRail";
import { CompositionsFilters } from "./CompositionsFilters";
import { ListError, ListSkeleton, SummarySkeleton } from "./CompositionsListStates";
import { CompositionsGrid, CompositionsTable } from "./CompositionsTable";

export function CompositionsListPage() {
  const searchParams = useSearchParams();
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [collection, setCollection] = useState(initial.collection);
  const [filters, setFilters] = useState(initial.filters);
  const [sort, setSort] = useState(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [library, setLibrary] = useState<CompositionLibraryPage | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const [isGrid, setIsGrid] = useState(false);
  const [dialogAction, setDialogAction] = useState<CompositionDialogAction | null>(null);
  const [dialogTarget, setDialogTarget] = useState<CompositionLibraryItem | null>(null);

  const restoreUrlState = useCallback(() => {
    const next = readListState(new URLSearchParams(window.location.search));
    setCollection(next.collection);
    setFilters(next.filters);
    setSort(next.sort);
    setPage(next.page);
    setPerPage(next.perPage);
  }, []);
  const qs = writeListState({ collection, filters, sort, page, perPage });
  useListUrlState(qs, restoreUrlState);

  useEffect(() => {
    let alive = true;
    fetchContentFolders("composition").then((data) => alive && setFolders(data)).catch(() => alive && setFolders([]));
    return () => { alive = false; };
  }, [retryVersion]);

  useEffect(() => {
    let alive = true;
    fetchCompositionLibrary({
      search: filters.query || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      kind: filters.kind === "all" ? undefined : filters.kind,
      folderId: collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined,
      uncategorized: collection === "uncategorized",
      trash: collection === "trash",
      content: filters.content === "all" ? undefined : filters.content,
      usage: filters.usage === "all" ? undefined : filters.usage,
      referenceResolution: filters.referenceResolution || undefined,
      sort: sort.key,
      dir: sort.dir,
      page,
      pageSize: perPage,
    }).then((data) => {
      if (!alive) return;
      setLibrary(data);
      setError(null);
    }).catch((reason) => alive && setError(classifyApiError(reason, "โหลด Layouts ไม่สำเร็จ")));
    return () => { alive = false; };
  }, [collection, filters, page, perPage, retryVersion, sort]);

  const reload = () => setRetryVersion((value) => value + 1);
  const reset = () => {
    setCollection(DEFAULT_STATE.collection);
    setFilters(DEFAULT_STATE.filters);
    setSort(DEFAULT_STATE.sort);
    setPage(1);
    setPerPage(DEFAULT_STATE.perPage);
  };
  const changeFilters = (next: ListFilters) => { setFilters(next); setPage(1); };
  const changeCollection = (next: string) => { setCollection(next); setPage(1); };
  const changeSort = (key: SortKey) => {
    setSort((current) => current.key === key
      ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "updated" ? "desc" : "asc" });
    setPage(1);
  };

  const runImmediate = async (item: CompositionLibraryItem, run: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    setBusyId(item.id);
    try {
      await run();
      reload();
    } catch (reason) {
      setActionError(classifyApiError(reason, fallback).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (action: CompositionLibraryAction, item: CompositionLibraryItem) => {
    if (action === "activate" || action === "deactivate") {
      void runImmediate(item, () => setCompositionStatus(item.id, action === "activate" ? "active" : "inactive"), "เปลี่ยนสถานะ Layout ไม่สำเร็จ");
      return;
    }
    if (action === "restore") {
      void runImmediate(item, () => restoreComposition(item.id), "กู้คืน Layout ไม่สำเร็จ");
      return;
    }
    setDialogAction(action);
    setDialogTarget(item);
  };

  const closeDialog = () => { setDialogAction(null); setDialogTarget(null); };
  const summary = library?.summary;
  const pagination = library?.pagination;
  if (error?.kind === "forbidden" && !library) return <NoAccess />;

  return <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6">
    <PageHeader title="Layouts" subtitle="Create, organize, and manage screen layouts for your displays." actions={<><Link href="/media-workspace/layouts/templates" className={buttonClasses("secondary")}>Manage Templates</Link><Link href="/media-workspace/layouts/create" className={buttonClasses("primary")}>+ New Layout</Link></>} />
    {summary ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatTile label="Total Layouts" value={String(summary.total)} /><StatTile label="Template-based" value={String(summary.templateBased)} /><StatTile label="Custom" value={String(summary.custom)} /><button type="button" onClick={() => changeFilters({ ...filters, content: "incomplete" })}><StatTile label="Needs content" value={String(summary.needsContent)} /></button></div> : <SummarySkeleton />}
    <Card className="flex flex-1 flex-col overflow-hidden"><div className="grid min-h-0 flex-1 md:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r"><p className="mb-2 shrink-0 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Folders</p><CompositionFolderRail folders={folders} selected={collection} isLoading={!library && folders.length === 0} onSelect={changeCollection} onRefresh={reload} onError={(reason) => setActionError(classifyApiError(reason, "อัปเดต Folder ไม่สำเร็จ").message)} /></aside>
      <main className="flex min-h-0 min-w-0 flex-col p-5"><CompositionsFilters value={filters} referenceResolutions={library?.facets.referenceResolutions ?? []} isGrid={isGrid} onViewChange={setIsGrid} onChange={changeFilters} onClearAll={qs ? reset : undefined} />
        {library?.isLegacyResponse && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Layouts Library filters and summary need the Core read-model rollout.</p>}
        {actionError && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}
        {error && <ListError message={error.message} onRetry={reload} retrying={false} />}
        <div className="min-h-0 flex-1 overflow-auto">
          {!library ? (error ? null : <ListSkeleton />) : library.data.length === 0 ? <p className="py-10 text-center text-sm text-zinc-500">No layouts found.</p> : isGrid ? <CompositionsGrid rows={library.data} inTrash={collection === "trash"} busyId={busyId} onAction={handleAction} /> : <CompositionsTable rows={library.data} sort={sort} inTrash={collection === "trash"} busyId={busyId} onSort={changeSort} onAction={handleAction} />}
        </div>
      </main>
    </div>{pagination && <div className="shrink-0 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 [&>div]:mt-0"><Pagination page={pagination.page} totalPages={pagination.totalPages} perPage={perPage} totalItems={pagination.total} rangeStart={(pagination.page - 1) * perPage + 1} rangeEnd={Math.min(pagination.page * perPage, pagination.total)} itemLabel="layouts" onPageChange={setPage} onPerPageChange={(next) => { setPerPage(next); setPage(1); }} /></div>}</Card>
    <CompositionLibraryDialogs action={dialogAction} target={dialogTarget} folders={folders} onClose={closeDialog} onDone={() => { closeDialog(); reload(); }} onError={(reason) => { setActionError(classifyApiError(reason, "อัปเดต Layout ไม่สำเร็จ").message); closeDialog(); }} />
  </div>;
}
