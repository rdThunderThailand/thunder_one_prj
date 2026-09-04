"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { classifyApiError } from "@/lib/api/api-error";
import { permanentlyDeletePlaylist, restorePlaylist } from "@/lib/api/media-api";
import { FeatureFolderRail } from "../../content-library/FeatureFolderRail";
import { duplicatePlaylist, upsertPlaylist } from "../services/playlists-api";
import { copyName, filterPlaylists, paginate, sortPlaylists, summarize } from "../list-filtering";
import { filterByCollection, folderCounts } from "../folder-filtering";
import { filterByTag, tagCounts } from "../tag-filtering";
import { readListState, writeListState, DEFAULT_STATE, type Collection } from "../list-url-state";
import type { Sort, SortKey } from "../list-filtering";
import type { PlaylistListItem } from "../types";
import { usePlaylistsListData } from "../use-playlists-list-data";
import { PlaylistsFilters, type FilterState } from "./PlaylistsFilters";
import { PlaylistsTable, type RowAction } from "./PlaylistsTable";
import { PlaylistsListDialogs, type PlaylistDialogAction } from "./PlaylistsListDialogs";
import { PlaylistTagsDialog } from "./PlaylistTagsDialog";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";
import { TagsRail } from "./TagsRail";
import { emptyCause, hasActiveFilters } from "../list-empty-state";
import { ListEmpty, ListError, ListSkeleton, StatCard, SummarySkeleton } from "./PlaylistsListStates";

const RAIL_LABELS = { all: "All", uncategorized: "Uncategorized", trash: "Trash" };
const railTabClass = (active: boolean) =>
  `rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
    active ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
  }`;

export function PlaylistsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once on mount — the URL is the initial value, not a live subscription.
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [collection, setCollection] = useState<Collection>(initial.collection);
  const [tagId, setTagId] = useState<string | null>(initial.tagId);
  const [railTab, setRailTab] = useState<"folders" | "tags">(initial.tagId ? "tags" : "folders");
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ action: PlaylistDialogAction; target: PlaylistListItem } | null>(null);
  const [tagsTarget, setTagsTarget] = useState<PlaylistListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashBusy, setEmptyTrashBusy] = useState(false);

  const inTrash = collection === "trash";
  const { playlists, trashed, folders, error, refreshing, reload } = usePlaylistsListData(inTrash);

  const restore = useCallback(() => {
    const s = readListState(new URLSearchParams(window.location.search));
    setCollection(s.collection);
    setTagId(s.tagId);
    setRailTab(s.tagId ? "tags" : "folders");
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

  const counts = useMemo(() => folderCounts(playlists ?? [], folders), [playlists, folders]);
  const tags = useMemo(() => tagCounts(playlists ?? []), [playlists]);

  // In Trash the rail's own dataset feeds the table; a tag selection and a folder
  // selection are mutually exclusive (#41), so at most one narrows the active dataset.
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
  const emptyTrashTargets = useMemo(
    () => (inTrash ? (trashed ?? []).filter((playlist) => (playlist.publication_count ?? 0) === 0) : []),
    [inTrash, trashed]
  );
  const emptyTrashLocked = inTrash ? (trashed?.length ?? 0) - emptyTrashTargets.length : 0;

  // Selecting a folder (or Trash) clears any tag selection, and vice versa — the rail's
  // two tabs are mutually exclusive (#41 AC).
  const changeCollection = (next: Collection) => {
    setTagId(null);
    setCollection(next);
    setPage(1);
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

  const handleEmptyTrash = async () => {
    setEmptyTrashBusy(true);
    setActionError(null);
    try {
      const results = await Promise.allSettled(emptyTrashTargets.map((playlist) => permanentlyDeletePlaylist(playlist.id)));
      const deleted = results.filter((result) => result.status === "fulfilled" && result.value.deleted).length;
      const skipped = emptyTrashLocked + results.filter((result) => result.status === "fulfilled" && !result.value.deleted).length;
      const failed = results.filter((result) => result.status === "rejected").length;
      await reload();
      setEmptyTrashOpen(false);
      if (skipped || failed) {
        setActionError(`ลบถาวรแล้ว ${deleted} playlist; ข้าม ${skipped} playlist ที่ถูกล็อก${failed ? `; ล้มเหลว ${failed} playlist` : ""}`);
      }
    } catch (err) {
      setActionError(classifyApiError(err, "ล้างถังขยะไม่สำเร็จ").message);
    } finally {
      setEmptyTrashBusy(false);
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
  const loading = inTrash ? trashed === null : playlists === null;
  const cause = inTrash
    ? "trash-empty"
    : tagId && !hasActiveFilters(filters)
      ? "tag-empty"
      : collection !== "all" && collection !== "uncategorized" && !hasActiveFilters(filters)
        ? "folder-empty"
        : emptyCause({ totalCount: (playlists ?? []).length, hasActiveFilters: hasActiveFilters(filters) });

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6">
      <PageHeader
        title="Playlists"
        subtitle="Create and manage playlists for your campaigns and channels."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            + Create Playlist
          </Button>
        }
      />

      {stats === null ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Playlists" value={stats.total} />
          <StatCard label="Draft" value={stats.draft} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
        </div>
      )}

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 md:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r">
            <div className="mb-2 flex shrink-0 gap-1 px-1">
              <button type="button" className={railTabClass(railTab === "folders")} onClick={() => setRailTab("folders")}>
                Folders
              </button>
              <button type="button" className={railTabClass(railTab === "tags")} onClick={() => setRailTab("tags")}>
                Tags
              </button>
            </div>
            {railTab === "folders" ? (
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
            ) : (
              <TagsRail tags={tags} selected={tagId} onSelect={changeTag} />
            )}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col p-5">
            {refreshing && playlists !== null && <span className="mb-3 self-end text-xs text-zinc-400">กำลังรีเฟรช…</span>}

            <PlaylistsFilters
              onClearAll={!inTrash && qs !== "" ? handleClearAll : undefined}
              value={filters}
              onChange={(next) => { setFilters(next); setPage(1); }}
              tailAction={inTrash ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={emptyTrashTargets.length === 0 || emptyTrashBusy}
                  onClick={() => setEmptyTrashOpen(true)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Empty Trash
                </Button>
              ) : undefined}
            />

            {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}
            {error && playlists !== null && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-500">{error.message}</p>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              {loading && !error ? (
                <ListSkeleton />
              ) : playlists === null && error ? (
                <ListError message={error.message} onRetry={reload} retrying={refreshing} />
              ) : rows.length === 0 ? (
                <ListEmpty cause={cause} onClearFilters={handleClearAll} />
              ) : (
                <PlaylistsTable
                  rows={rows}
                  busyId={busyId}
                  sort={sort}
                  inTrash={inTrash}
                  onAction={handleAction}
                  onSortChange={handleSortChange}
                />
              )}
            </div>
          </main>
        </div>
        {!loading && rows.length > 0 && (
          <div className="shrink-0 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 [&>div]:mt-0">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              totalItems={sorted.length}
              rangeStart={(currentPage - 1) * perPage + 1}
              rangeEnd={Math.min(currentPage * perPage, sorted.length)}
              itemLabel="playlists"
              onPageChange={setPage}
              onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
            />
          </div>
        )}
      </Card>

      <PlaylistsListDialogs
        key={dialog ? `${dialog.action}:${dialog.target.id}` : "none"}
        action={dialog?.action ?? null}
        target={dialog?.target ?? null}
        folders={folders}
        onClose={() => setDialog(null)}
        onDone={() => { setDialog(null); void reload(); }}
        onError={(message) => { setActionError(message); setDialog(null); }}
      />
      <PlaylistTagsDialog
        key={tagsTarget ? `tags:${tagsTarget.id}` : "tags:none"}
        target={tagsTarget}
        onClose={() => setTagsTarget(null)}
        onDone={() => { setTagsTarget(null); void reload(); }}
        onError={(message) => { setActionError(message); setTagsTarget(null); }}
      />
      <CreatePlaylistDialog
        key={createOpen ? `create:${collection}` : "create:closed"}
        open={createOpen}
        folders={folders}
        initialFolderId={collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : ""}
        onClose={() => setCreateOpen(false)}
        onCreated={(playlistId) => router.push(`/media-workspace/playlists/${playlistId}`)}
        onError={(message) => { setActionError(message); setCreateOpen(false); }}
      />
      <Modal
        open={emptyTrashOpen}
        onClose={() => { if (!emptyTrashBusy) setEmptyTrashOpen(false); }}
        title="Empty Trash?"
        footer={<>
          <Button type="button" variant="secondary" disabled={emptyTrashBusy} onClick={() => setEmptyTrashOpen(false)}>Cancel</Button>
          <Button type="button" disabled={emptyTrashBusy || emptyTrashTargets.length === 0} onClick={() => void handleEmptyTrash()} className="bg-red-600 hover:bg-red-500">
            {emptyTrashBusy ? "กำลังลบ…" : "Empty Trash"}
          </Button>
        </>}
      >
        <p>Permanently delete {emptyTrashTargets.length} playlist{emptyTrashTargets.length === 1 ? "" : "s"} from Trash? This cannot be undone.</p>
        {emptyTrashLocked > 0 && <p>{emptyTrashLocked} playlist{emptyTrashLocked === 1 ? "" : "s"} will be skipped because they have been published.</p>}
      </Modal>
    </div>
  );
}
