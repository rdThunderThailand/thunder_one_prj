"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { fetchContentFolders } from "@/lib/api/media-api";
import { ContentFolderRail } from "@/features/media-workspace/content-library/ContentFolderRail";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchCompositionLibrary } from "../services/compositions-api";
import type { CompositionLibraryPage } from "../types";
import { DEFAULT_STATE, readListState, writeListState, type ListFilters, type SortKey } from "../list-url-state";
import { CompositionsFilters } from "./CompositionsFilters";
import { CompositionsTable } from "./CompositionsTable";
import { ListError, ListSkeleton, SummarySkeleton } from "./CompositionsListStates";

export function CompositionsListPage() {
  const searchParams = useSearchParams();
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [collection, setCollection] = useState(initial.collection);
  const [filters, setFilters] = useState(initial.filters);
  const [sort, setSort] = useState(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [library, setLibrary] = useState<CompositionLibraryPage | null>(null);
  const [folders, setFolders] = useState<Awaited<ReturnType<typeof fetchContentFolders>>>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  const restore = useCallback(() => {
    const next = readListState(new URLSearchParams(window.location.search));
    setCollection(next.collection); setFilters(next.filters); setSort(next.sort); setPage(next.page); setPerPage(next.perPage);
  }, []);
  const qs = writeListState({ collection, filters, sort, page, perPage });
  useListUrlState(qs, restore);

  useEffect(() => {
    let alive = true;
    fetchContentFolders("composition").then((data) => alive && setFolders(data)).catch(() => alive && setFolders([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetchCompositionLibrary({ search: filters.query || undefined, status: filters.status === "all" ? undefined : filters.status, kind: filters.kind === "all" ? undefined : filters.kind, folderId: collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined, uncategorized: collection === "uncategorized", trash: collection === "trash", content: filters.content === "all" ? undefined : filters.content, usage: filters.usage === "all" ? undefined : filters.usage, referenceResolution: filters.referenceResolution || undefined, sort: sort.key, dir: sort.dir, page, pageSize: perPage }).then((data) => alive && setLibrary(data)).catch((reason) => alive && setError(classifyApiError(reason, "โหลด Layouts ไม่สำเร็จ")));
    return () => { alive = false; };
  }, [collection, filters, page, perPage, sort, retryVersion]);

  const reset = () => { setCollection(DEFAULT_STATE.collection); setFilters(DEFAULT_STATE.filters); setSort(DEFAULT_STATE.sort); setPage(1); setPerPage(DEFAULT_STATE.perPage); };
  const changeFilters = (next: ListFilters) => { setFilters(next); setPage(1); };
  const changeCollection = (next: string) => { setCollection(next); setPage(1); };
  const changeSort = (key: SortKey) => { setSort((current) => current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updated" ? "desc" : "asc" }); setPage(1); };
  const summary = library?.summary;
  const pagination = library?.pagination;

  return <div className="flex flex-col gap-6"><PageHeader title="Layouts" subtitle="Create, organize, and manage screen layouts for your displays." actions={<><Link href="/media-workspace/layouts/templates" className={buttonClasses("secondary")}>Manage Templates</Link><Link href="/media-workspace/layouts/create" className={buttonClasses("primary")}>+ New Layout</Link></>} />
    {summary ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatTile label="Total Layouts" value={String(summary.total)} /><StatTile label="Template-based" value={String(summary.templateBased)} /><StatTile label="Custom" value={String(summary.custom)} /><button type="button" onClick={() => changeFilters({ ...filters, content: "incomplete" })}><StatTile label="Needs content" value={String(summary.needsContent)} /></button></div> : <SummarySkeleton />}
    <Card className="overflow-hidden"><div className="grid min-h-[520px] md:grid-cols-[230px_1fr]"><aside className="border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r"><p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Folders</p><ContentFolderRail folders={folders} selected={collection} labels={{ all: "All Layouts", uncategorized: "Uncategorized", trash: "Trash" }} onSelect={changeCollection} /></aside><main className="p-5"><CompositionsFilters value={filters} referenceResolutions={library?.facets.referenceResolutions ?? []} onChange={changeFilters} onClearAll={qs ? reset : undefined} />{library?.isLegacyResponse && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Layouts Library filters and summary need the Core read-model rollout.</p>}{error && <ListError message={error.message} onRetry={() => setRetryVersion((value) => value + 1)} retrying={false} />}{!library ? (error ? null : <ListSkeleton />) : library.data.length === 0 ? <p className="py-10 text-center text-sm text-zinc-500">No layouts found.</p> : <><CompositionsTable rows={library.data} sort={sort} onSort={changeSort} />{pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} perPage={perPage} totalItems={pagination.total} rangeStart={(pagination.page - 1) * perPage + 1} rangeEnd={Math.min(pagination.page * perPage, pagination.total)} itemLabel="layouts" onPageChange={setPage} onPerPageChange={(next) => { setPerPage(next); setPage(1); }} />}</>}</main></div></Card></div>;
}
