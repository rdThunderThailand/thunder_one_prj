"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus, Trash2, Undo2 } from "lucide-react";
import { NoAccess } from "@/components/ui/NoAccess";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { LibraryPagination } from "../../content-library/LibraryChrome";
import { LibraryShell } from "../../content-library/LibraryShell";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchContentFolders, fetchMediaAssets } from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { PlaybackPreviewDialog } from "@/features/media-workspace/preview/PlaybackPreviewDialog";
import { loadCompositionPreview, type StagePreview } from "@/features/media-workspace/preview/composition-preview";
import { editorGeometryOptions } from "@/features/media-workspace/preview/preview-geometry";
import type { CompositionLibraryAction } from "../library-actions";
import { DEFAULT_STATE, readListState, writeListState, type ListFilters, type SortKey } from "../list-url-state";
import { fetchCompositionLibrary, permanentlyDeleteComposition, restoreComposition, setCompositionStatus, trashComposition } from "../services/compositions-api";
import type { CompositionLibraryItem, CompositionLibraryPage } from "../types";
import { CompositionLibraryDialogs, type CompositionDialogAction } from "./CompositionLibraryDialogs";
import { LayoutTemplatePicker } from "@/features/media-workspace/layouts/components/LayoutTemplatePicker";
import { TagsRail } from "@/features/media-workspace/content-library/TagsRail";
import { CompositionFolderRail } from "./CompositionFolderRail";
import { CompositionsFilters } from "./CompositionsFilters";
import { CompositionsSummary, ListEmpty, ListError, ListSkeleton, SummarySkeleton } from "./CompositionsListStates";
import { CompositionsGrid, CompositionsTable } from "./CompositionsTable";
import { CompositionBatchMoveDialog } from "./CompositionBatchMoveDialog";
export function CompositionsListPage() {
  const searchParams = useSearchParams();
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [collection, setCollection] = useState(initial.collection);
  const [tagId, setTagId] = useState(initial.tagId);
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<CompositionLibraryItem | null>(null);
  const [preview, setPreview] = useState<StagePreview | null>(null);
  const [previewAssets, setPreviewAssets] = useState<MediaAsset[]>([]);
  const [previewBusyId, setPreviewBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const restoreUrlState = useCallback(() => {
    const next = readListState(new URLSearchParams(window.location.search));
    setCollection(next.collection);
    setTagId(next.tagId);
    setFilters(next.filters);
    setSort(next.sort);
    setPage(next.page);
    setPerPage(next.perPage);
  }, []);
  const qs = writeListState({ collection, tagId, filters, sort, page, perPage });
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
      tagId: tagId ?? undefined,
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
  }, [collection, filters, page, perPage, retryVersion, sort, tagId]);

  const reload = () => setRetryVersion((value) => value + 1);
  const reset = () => {
    setCollection(DEFAULT_STATE.collection);
    setTagId(DEFAULT_STATE.tagId);
    setFilters(DEFAULT_STATE.filters);
    setSort(DEFAULT_STATE.sort);
    setPage(1);
    setPerPage(DEFAULT_STATE.perPage);
  };
  const changeFilters = (next: ListFilters) => { setFilters(next); setPage(1); };
  const changeCollection = (next: string) => { setTagId(null); setCollection(next); setSelectedIds(new Set()); setPage(1); };
  const changeTag = (next: string | null) => { setCollection("all"); setTagId(next); setPage(1); };
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

  const openPreview = async (item: CompositionLibraryItem) => {
    setActionError(null);
    setPreviewBusyId(item.id);
    try {
      const [loadedPreview, assets] = await Promise.all([loadCompositionPreview(item.id), fetchMediaAssets()]);
      setPreview(loadedPreview);
      setPreviewAssets(assets);
      setPreviewTarget(item);
    } catch (reason) {
      setActionError(classifyApiError(reason, "โหลด Preview ไม่สำเร็จ").message);
    } finally {
      setPreviewBusyId(null);
    }
  };

  const closePreview = () => { setPreviewTarget(null); setPreview(null); setPreviewAssets([]); };

  const closeDialog = () => { setDialogAction(null); setDialogTarget(null); };
  const loadAllTrash = async () => {
    const first = await fetchCompositionLibrary({ trash: true, page: 1, pageSize: 50 });
    const rest = await Promise.all(Array.from({ length: (first.pagination?.totalPages ?? 1) - 1 }, (_, index) => fetchCompositionLibrary({ trash: true, page: index + 2, pageSize: 50 })));
    return [first, ...rest].flatMap((result) => result.data);
  };
  const runBatch = async (mode: "trash" | "restore" | "delete", ids?: string[]) => {
    const targets = ids ?? (await loadAllTrash()).map((item) => item.id);
    if (!targets.length) return;
    const verb = mode === "trash" ? "Move" : mode === "restore" ? "Recover" : "Permanently delete";
    if (!window.confirm(`${verb} ${targets.length} layout${targets.length === 1 ? "" : "s"}?${mode === "delete" ? " This cannot be undone." : ""}`)) return;
    setBatchBusy(true);
    const action = mode === "trash" ? trashComposition : mode === "restore" ? restoreComposition : permanentlyDeleteComposition;
    const results = await Promise.allSettled(targets.map((id) => action(id)));
    const failed = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" &&
          typeof result.value === "object" &&
          result.value !== null &&
          (("trashed" in result.value && !result.value.trashed) || ("deleted" in result.value && !result.value.deleted))),
    ).length;
    setSelectedIds(new Set());
    setActionError(failed ? `${failed} layout${failed === 1 ? "" : "s"} could not be updated because it is in use.` : null);
    reload();
    setBatchBusy(false);
  };
  const summary = library?.summary;
  const pagination = library?.pagination;
  if (error?.kind === "forbidden" && !library) return <NoAccess />;

  const inTrash = collection === "trash";
  const collectionName = inTrash ? "Trash" : tagId ? library?.facets.tags.find((tag) => tag.id === tagId)?.name ?? "Tag" : collection === "uncategorized" ? "Uncategorized" : collection === "all" ? "All Layouts" : folders.find((folder) => folder.id === collection)?.name ?? "Folder";
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  const selectionActions = selectedIds.size > 0 && (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-1 text-[9px]">
      <strong className="px-2">{selectedIds.size} selected</strong>
      {inTrash ? (
        <>
          <Button variant="outline" size="sm" disabled={batchBusy} onClick={() => void runBatch("restore", [...selectedIds])}><Undo2 className="h-3.5 w-3.5" />Recover</Button>
          <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => void runBatch("delete", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Delete forever</Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={() => setBatchMoveOpen(true)}>Move</Button>
          <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => void runBatch("trash", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Trash</Button>
        </>
      )}
      <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Layouts"
        subtitle="Create, organize, and manage screen layouts for your displays."
        titleInTopbar
        actions={
          <>
            <Link href="/media-workspace/layouts/templates" className={buttonVariants({ variant: "outline", size: "sm" })}>Manage Templates</Link>
            <Button size="sm" onClick={() => setPickerOpen(true)}><Plus className="h-3.5 w-3.5" />New Layout</Button>
          </>
        }
      />
      {summary ? (
        <CompositionsSummary summary={summary} onNeedsContent={() => changeFilters({ ...filters, content: "incomplete" })} />
      ) : (
        <SummarySkeleton count={4} />
      )}
      <LibraryShell
        toolbar={<CompositionsFilters value={filters} referenceResolutions={library?.facets.referenceResolutions ?? []} isGrid={isGrid} onViewChange={setIsGrid} onChange={changeFilters} onClearAll={qs ? reset : undefined} />}
        rail={{
          defaultTab: tagId ? "tags" : "folders",
          folders: (
            <CompositionFolderRail
              folders={folders}
              selected={collection}
              isLoading={!library && folders.length === 0}
              onSelect={changeCollection}
              onRefresh={reload}
              onError={(reason) => setActionError(classifyApiError(reason, "อัปเดต Folder ไม่สำเร็จ").message)}
            />
          ),
          tags: <TagsRail tags={library?.facets.tags ?? []} selected={tagId} onSelect={changeTag} />,
        }}
        title={collectionName}
        meta={pagination ? `${pagination.total.toLocaleString()} layouts` : "…"}
        headerActions={selectionActions || (inTrash && (
          <>
            <Button variant="outline" size="sm" disabled={batchBusy || !library?.pagination?.total} onClick={() => void runBatch("restore")}><Undo2 className="h-3.5 w-3.5" />Recover All</Button>
            <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy || !library?.pagination?.total} onClick={() => void runBatch("delete")}><Trash2 className="h-3.5 w-3.5" />Delete All</Button>
          </>
        ))}
        footer={pagination && (
          <LibraryPagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={perPage} onPage={setPage} itemLabel="layouts" perPageOptions={[10, 25, 50]} onPageSize={(next) => { setPerPage(next); setPage(1); }} />
        )}
      >
        {library?.isLegacyResponse && (
          <p className="mb-3 rounded-lg bg-warning-soft p-3 text-[10px] text-warning">Layouts Library filters and summary need the Core read-model rollout.</p>
        )}
        {actionError && <p role="alert" className="mb-3 text-[10px] text-danger">{actionError}</p>}
        {error && <ListError message={error.message} onRetry={reload} retrying={false} />}
        {!library ? (
          error ? null : <ListSkeleton />
        ) : library.data.length === 0 ? (
          <ListEmpty cause={qs ? "no-match" : "no-compositions"} onClearFilters={reset} />
        ) : isGrid ? (
          <CompositionsGrid rows={library.data} inTrash={inTrash} busyId={busyId} previewBusyId={previewBusyId} onPreview={(item) => void openPreview(item)} onAction={handleAction} />
        ) : (
          <CompositionsTable rows={library.data} folders={folderNames} sort={sort} inTrash={inTrash} busyId={busyId} previewBusyId={previewBusyId} onSort={changeSort} onPreview={(item) => void openPreview(item)} onAction={handleAction} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        )}
      </LibraryShell>
      <LayoutTemplatePicker
        open={pickerOpen}
        folders={folders}
        tagNames={library?.facets.tags.map((tag) => tag.name) ?? []}
        onClose={() => setPickerOpen(false)}
      />
      {previewTarget && preview && (
        <PlaybackPreviewDialog
          open
          onClose={closePreview}
          zones={preview.zones}
          assets={previewAssets}
          aspectRatio={preview.aspectRatio}
          geometryOptions={editorGeometryOptions(preview.referenceResolution)}
          referenceResolution={preview.referenceResolution}
          layoutName={previewTarget.name}
          editHref={`/media-workspace/layouts/${encodeURIComponent(previewTarget.id)}`}
          canOpenFullPreview
          onOpenFullPreview={() => window.open(`/media-workspace/preview/composition/${encodeURIComponent(previewTarget.id)}`, "_blank", "noopener")}
        />
      )}
      <CompositionLibraryDialogs key={`${dialogAction}:${dialogTarget?.id ?? ""}`} action={dialogAction} target={dialogTarget} folders={folders} onClose={closeDialog} onDone={() => { closeDialog(); reload(); }} onError={(reason) => { setActionError(classifyApiError(reason, "อัปเดต Layout ไม่สำเร็จ").message); closeDialog(); }} />
      <CompositionBatchMoveDialog key={batchMoveOpen ? [...selectedIds].join(":") : "closed"} open={batchMoveOpen} ids={[...selectedIds]} folders={folders} onClose={() => setBatchMoveOpen(false)} onDone={() => { setBatchMoveOpen(false); setSelectedIds(new Set()); reload(); }} onError={(reason) => { setActionError(classifyApiError(reason, "ย้าย Layout ไม่สำเร็จ").message); setBatchMoveOpen(false); }} />
    </div>
  );
}
