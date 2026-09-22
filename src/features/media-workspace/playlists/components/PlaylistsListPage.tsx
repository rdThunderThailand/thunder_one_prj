"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus, Trash2, Undo2 } from "lucide-react";
import { NoAccess } from "@/components/ui/NoAccess";
import { Button } from "@/components/ui/lovable/button";
import { LibraryPagination } from "../../content-library/LibraryChrome";
import { LibrarySelectionBar, LibraryShell } from "../../content-library/LibraryShell";
import { classifyApiError } from "@/lib/api/api-error";
import { restorePlaylist } from "@/lib/api/media-api";
import { FeatureFolderRail } from "../../content-library/FeatureFolderRail";
import { duplicatePlaylist, upsertPlaylist } from "../services/playlists-api";
import { copyName, filterPlaylists, paginate, sortPlaylists, summarize } from "../list-filtering";
import { filterByCollection, folderCounts } from "../folder-filtering";
import { filterByTag, tagCounts } from "../tag-filtering";
import { readListState, writeListState, DEFAULT_STATE, type Collection } from "../list-url-state";
import type { Sort, SortKey } from "../list-filtering";
import type { PlaylistListItem } from "../types";
import { usePlaylistsListData } from "../use-playlists-list-data";
import { usePlaylistListPreview } from "../use-playlist-list-preview";
import { PlaylistPreviewModal } from "../../preview/PlaylistPreviewModal";
import { useTrashBatch } from "../use-trash-batch";
import { PlaylistsFilters, type FilterState } from "./PlaylistsFilters";
import { PlaylistsTable, type RowAction } from "./PlaylistsTable";
import { PlaylistsGrid } from "./PlaylistsGrid";
import { EmptyTrashDialog } from "./EmptyTrashDialog";
import { PlaylistsListDialogs, type PlaylistDialogAction } from "./PlaylistsListDialogs";
import { PlaylistBatchMoveDialog } from "./PlaylistBatchMoveDialog";
import { PlaylistTagsDialog } from "./PlaylistTagsDialog";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";
import { TagsRail } from "../../content-library/TagsRail";
import { emptyCause, hasActiveFilters } from "../list-empty-state";
import { ListEmpty, ListError, ListSkeleton, PlaylistsSummary, SummarySkeleton } from "./PlaylistsListStates";

const RAIL_LABELS = { all: "All Playlists", uncategorized: "Uncategorized", trash: "Trash" };
const PER_PAGE_OPTIONS = [10, 25, 50];
const VIEW_KEY = "media-workspace-playlists-view";
const subscribeView = (notify: () => void) => { window.addEventListener("storage", notify); return () => window.removeEventListener("storage", notify); };
const readView = () => window.localStorage.getItem(VIEW_KEY) === "grid";
export function PlaylistsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once on mount — the URL is the initial value, not a live subscription.
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [collection, setCollection] = useState<Collection>(initial.collection);
  const [tagId, setTagId] = useState<string | null>(initial.tagId);
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ action: PlaylistDialogAction; target: PlaylistListItem } | null>(null);
  const [tagsTarget, setTagsTarget] = useState<PlaylistListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const isGrid = useSyncExternalStore(subscribeView, readView, () => false);

  const inTrash = collection === "trash";
  const { playlists, trashed, folders, error, refreshing, reload } = usePlaylistsListData(inTrash);
  const {
    selectedIds, setSelectedIds, emptyTrashOpen, setEmptyTrashOpen, emptyTrashBusy,
    emptyTrashTargets, emptyTrashLocked, runBatch, handleEmptyTrash,
  } = useTrashBatch({ inTrash, trashed, reload, onError: setActionError });
  const listPreview = usePlaylistListPreview((reason) => setActionError(classifyApiError(reason, "โหลด Preview ไม่สำเร็จ").message));

  const restore = useCallback(() => {
    const s = readListState(new URLSearchParams(window.location.search));
    setCollection(s.collection);
    setTagId(s.tagId);
    setFilters(s.filters);
    setSort(s.sort);
    setPage(s.page);
    setPerPage(s.perPage);
  }, []);
  const qs = writeListState({ collection, tagId, filters, sort, page, perPage });
  useListUrlState(qs, restore);

  const handleSortChange = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "updated" || key === "duration" ? "desc" : "asc" }
    );
    setPage(1);
  };
  const handleViewChange = (next: boolean) => {
    window.localStorage.setItem(VIEW_KEY, next ? "grid" : "list");
    window.dispatchEvent(new StorageEvent("storage", { key: VIEW_KEY }));
  };

  const counts = useMemo(() => folderCounts(playlists ?? [], folders), [playlists, folders]);
  const tags = useMemo(() => tagCounts(playlists ?? []), [playlists]);

  const base = useMemo(() => {
    if (inTrash) return trashed ?? [];
    if (tagId) return filterByTag(playlists ?? [], tagId);
    return filterByCollection(playlists ?? [], collection, folders);
  }, [inTrash, trashed, playlists, tagId, collection, folders]);
  const filtered = useMemo(
    () => filterPlaylists(base, filters),
    [base, filters]
  );
  const sorted = useMemo(() => sortPlaylists(filtered, sort), [filtered, sort]);
  const { rows, page: currentPage, totalPages } = paginate(sorted, page, perPage);
  const changeCollection = (next: Collection) => {
    setTagId(null);
    setCollection(next);
    setPage(1);
    setSelectedIds(new Set());
  };
  const changeTag = (next: string | null) => {
    setCollection(DEFAULT_STATE.collection);
    setTagId(next);
    setPage(1);
  };
  const handleClearAll = () => {
    setCollection(DEFAULT_STATE.collection);
    setTagId(DEFAULT_STATE.tagId);
    setFilters(DEFAULT_STATE.filters);
    setSort(DEFAULT_STATE.sort);
    setPage(DEFAULT_STATE.page);
    setPerPage(DEFAULT_STATE.perPage);
  };

  const runImmediate = async (playlist: PlaylistListItem, run: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    setBusyId(playlist.id);
    try {
      await run();
      await reload();
    } catch (err) {
      setActionError(classifyApiError(err, fallback).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = async (action: RowAction, playlist: PlaylistListItem) => {
    if (action === "restore") return void runImmediate(playlist, () => restorePlaylist(playlist.id), "กู้คืน playlist ไม่สำเร็จ");
    if (action === "move") return setDialog({ action: "move", target: playlist });
    if (action === "tags") return setTagsTarget(playlist);
    if (action === "delete") return setDialog({ action: "trash", target: playlist });
    if (action === "permanent-delete") return setDialog({ action: "permanent-delete", target: playlist });
    if (action === "duplicate") {
      return void runImmediate(
        playlist,
        async () => {
          const { itemsCopied } = await duplicatePlaylist(playlist.id, copyName(playlist.name, (playlists ?? []).map((p) => p.name)));
          if (!itemsCopied) setActionError("คัดลอก playlist แล้ว แต่ยังคัดลอกเนื้อหาไม่สำเร็จ — เปิดฉบับร่างเพื่อเพิ่มสื่อเอง");
        },
        "คัดลอก playlist ไม่สำเร็จ"
      );
    }
    // mark-ready — the one stored status transition (ADR 0060 §3, §6).
    void runImmediate(
      playlist,
      () => upsertPlaylist({ playlistId: playlist.id, name: playlist.name, status: "active" }),
      "ตั้งให้ playlist พร้อมใช้งานไม่สำเร็จ"
    );
  };

  if (error?.kind === "forbidden" && !playlists) return <NoAccess />;

  const stats = playlists !== null ? summarize(playlists) : null;
  const totalItems = (playlists ?? []).reduce((total, playlist) => total + playlist.item_count, 0);
  const totalDuration = (playlists ?? []).reduce((total, playlist) => total + (playlist.total_duration_seconds ?? 0), 0);
  const loading = inTrash ? trashed === null : playlists === null;
  const cause = inTrash
    ? "trash-empty"
    : tagId && !hasActiveFilters(filters)
      ? "tag-empty"
      : collection !== "all" && collection !== "uncategorized" && !hasActiveFilters(filters)
        ? "folder-empty"
        : emptyCause({ totalCount: (playlists ?? []).length, hasActiveFilters: hasActiveFilters(filters) });

  const collectionName = inTrash ? "Trash" : tagId ? tags.find((tag) => tag.id === tagId)?.name ?? "Tag" : collection === "uncategorized" ? "Uncategorized" : collection === "all" ? "All Playlists" : folders.find((folder) => folder.id === collection)?.name ?? "Folder";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Playlists" subtitle="Create and manage playlists for your campaigns and channels." titleInTopbar />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />Create Playlist</Button>
      </div>

      {stats === null ? (
        <SummarySkeleton count={6} />
      ) : (
        <PlaylistsSummary stats={stats} items={totalItems} duration={formatSummaryDuration(totalDuration)} />
      )}

      <LibraryShell
        toolbar={
          <>
            <PlaylistsFilters onClearAll={!inTrash && qs !== "" ? handleClearAll : undefined} value={filters} isGrid={isGrid} sort={sort} onViewChange={handleViewChange} onSortChange={handleSortChange} onChange={(next) => { setFilters(next); setPage(1); }} />
            {refreshing && playlists !== null && <span className="ml-auto text-[10px] text-muted-foreground">กำลังรีเฟรช…</span>}
          </>
        }
        selection={selectedIds.size > 0 && (
          <LibrarySelectionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
            {inTrash ? (
              <>
                <Button variant="outline" size="sm" disabled={emptyTrashBusy} onClick={() => void runBatch("restore", [...selectedIds])}><Undo2 className="h-3.5 w-3.5" />Recover</Button>
                <Button variant="outline" size="sm" className="text-destructive" disabled={emptyTrashBusy} onClick={() => void runBatch("delete", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Delete forever</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setBatchMoveOpen(true)}>Move</Button>
                <Button variant="outline" size="sm" className="text-destructive" disabled={emptyTrashBusy} onClick={() => void runBatch("trash", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Move to Trash</Button>
              </>
            )}
          </LibrarySelectionBar>
        )}
        rail={{
          defaultTab: tagId ? "tags" : "folders",
          folders: () => (
            <FeatureFolderRail
              scope="playlist"
              labels={RAIL_LABELS}
              folders={folders}
              selected={collection}
              counts={counts}
              isLoading={playlists === null && folders.length === 0}
              onSelect={changeCollection}
              onRefresh={reload}
              onError={(reason) => setActionError(classifyApiError(reason, "อัปเดต Folder ไม่สำเร็จ").message)}
            />
          ),
          tags: <TagsRail tags={tags} selected={tagId} onSelect={changeTag} />,
        }}
        title={collectionName}
        meta={loading ? "…" : `${sorted.length.toLocaleString()} playlists`}
        headerActions={inTrash && (
          <>
            <Button variant="outline" size="sm" disabled={(trashed?.length ?? 0) === 0 || emptyTrashBusy} onClick={() => void runBatch("restore", (trashed ?? []).map((playlist) => playlist.id))}><Undo2 className="h-3.5 w-3.5" />Recover All</Button>
            <Button variant="outline" size="sm" className="text-destructive" disabled={emptyTrashTargets.length === 0 || emptyTrashBusy} onClick={() => setEmptyTrashOpen(true)}><Trash2 className="h-3.5 w-3.5" />Delete All</Button>
          </>
        )}
        footer={!loading && rows.length > 0 && (
          <LibraryPagination page={currentPage} totalPages={totalPages} total={sorted.length} pageSize={perPage} onPage={setPage} itemLabel="playlists" perPageOptions={PER_PAGE_OPTIONS} onPageSize={(next) => { setPerPage(next); setPage(1); }} />
        )}
      >
        {actionError && <p className="mb-3 text-[10px] text-danger">{actionError}</p>}
        {error && playlists !== null && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft p-3">
            <p className="text-[10px] text-danger">{error.message}</p>
          </div>
        )}
        {loading && !error ? (
          <ListSkeleton />
        ) : playlists === null && error ? (
          <ListError message={error.message} onRetry={reload} retrying={refreshing} />
        ) : rows.length === 0 ? (
          <ListEmpty cause={cause} onClearFilters={handleClearAll} />
        ) : isGrid && !inTrash ? (
          <PlaylistsGrid rows={rows} />
        ) : (
          <PlaylistsTable rows={rows} busyId={busyId ?? listPreview.busyId} sort={sort} inTrash={inTrash} onAction={handleAction} onPreview={(playlist) => void listPreview.open(playlist.id)} onSortChange={handleSortChange} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        )}
      </LibraryShell>

      <PlaylistsListDialogs
        key={dialog ? `${dialog.action}:${dialog.target.id}` : "none"}
        action={dialog?.action ?? null}
        target={dialog?.target ?? null}
        folders={folders}
        onClose={() => setDialog(null)}
        onDone={() => { setDialog(null); void reload(); }}
        onError={(message) => { setActionError(message); setDialog(null); }}
      />
      <PlaylistBatchMoveDialog
        open={batchMoveOpen}
        ids={[...selectedIds]}
        folders={folders}
        onClose={() => setBatchMoveOpen(false)}
        onDone={() => { setBatchMoveOpen(false); setSelectedIds(new Set()); void reload(); }}
        onError={(reason) => { setActionError(classifyApiError(reason, "ย้าย playlist ไม่สำเร็จ").message); setBatchMoveOpen(false); }}
      />
      <PlaylistTagsDialog
        key={tagsTarget ? `tags:${tagsTarget.id}` : "tags:none"}
        target={tagsTarget}
        onClose={() => setTagsTarget(null)}
        onDone={() => { setTagsTarget(null); void reload(); }}
        onError={(message) => { setActionError(message); setTagsTarget(null); }}
      />
      {listPreview.current && (
        <PlaylistPreviewModal open onClose={listPreview.close} preview={listPreview.current.preview} assets={listPreview.current.assets} publishDisabledReason={null}
          onOpenFullPreview={() => window.open(`/media-workspace/preview/playlist/${listPreview.current?.id}`, "_blank", "noopener")}
          onPublish={() => router.push(`/media-workspace/publications/create?playlistId=${listPreview.current?.id}`)} />
      )}
      <CreatePlaylistDialog
        key={createOpen ? `create:${collection}` : "create:closed"}
        open={createOpen}
        folders={folders}
        initialFolderId={collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : ""}
        onClose={() => setCreateOpen(false)}
        onCreated={(playlistId) => router.push(`/media-workspace/playlists/${playlistId}`)}
        onError={(message) => { setActionError(message); setCreateOpen(false); }}
      />
      <EmptyTrashDialog open={emptyTrashOpen} busy={emptyTrashBusy} targets={emptyTrashTargets.length} locked={emptyTrashLocked} onOpenChange={setEmptyTrashOpen} onConfirm={handleEmptyTrash} />
    </div>
  );
}

function formatSummaryDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
