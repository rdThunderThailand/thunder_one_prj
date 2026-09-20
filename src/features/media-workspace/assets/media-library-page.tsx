"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, FileAudio, FileImage, FileText, FileVideo, Folder, FolderInput, Trash2, Undo2, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import {
  fetchContentFolders,
  fetchMediaAssets,
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { cn } from "@/lib/utils";
import { FeatureFolderRail } from "../content-library/FeatureFolderRail";
import { TagsRail } from "../content-library/TagsRail";
import { filterByTag, tagCounts } from "../content-library/tag-filtering";
import { folderCounts } from "../playlists/folder-filtering";
import type { FolderCollection } from "../content-library/ContentFolderRail";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { AssetCard } from "./components/AssetCard";
import { LibraryEmpty, LibraryGridSkeleton, LibraryPagination, LibrarySummary, LibrarySummarySkeleton } from "../content-library/LibraryChrome";
import { LibrarySelectionBar, LibraryShell } from "../content-library/LibraryShell";
import { LibraryToolbar, type AssetKindFilter } from "./components/LibraryToolbar";

type Collection = FolderCollection;
const PAGE_SIZE = 12;
const EMPTY_COPY = {
  library: ["No media yet", "Upload media to start building your library."],
  folder: ["This folder is empty", "Choose another folder or move media here."],
  trash: ["Trash is empty", "Items you move to Trash will appear here."],
  search: ["No media found", "Try adjusting your search or filters."],
} as const;

export function MediaLibraryPage() {
  const [collection, setCollection] = useState<Collection>("all");
  const [kind, setKind] = useState<AssetKindFilter>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrid, setIsGrid] = useState(true);
  const [tagId, setTagId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<{ mode: "trash" | "delete"; ids: string[] } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  // Summary cards describe the library, not the Trash — keep the last non-trash fetch.
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);

  const folderId = collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined;
  const isTrash = collection === "trash";
  const tags = useMemo(() => tagCounts(assets), [assets]);
  const counts = useMemo(() => folderCounts(assets, folders), [assets, folders]);
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    let result = assets.filter((asset) => {
      if (collection === "uncategorized" && asset.folder_id) return false;
      if (folderId && asset.folder_id !== folderId) return false;
      if (kind && asset.kind !== kind) return false;
      if (!query) return true;
      return `${asset.title ?? ""} ${asset.file?.original_filename ?? ""}`.toLocaleLowerCase().includes(query);
    });
    if (tagId) result = filterByTag(result, tagId);
    return result;
  }, [assets, collection, folderId, kind, search, tagId]);
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleAssets = filteredAssets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // One signing call for every card on the page, not one per card (ADR 0067).
  const previewIds = useMemo(() => [...new Set(visibleAssets.map((asset) => asset.id))], [visibleAssets]);
  const previews = usePreviewUrls(previewIds);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextAssets, nextFolders] = await Promise.all([
        fetchMediaAssets({ trash: collection === "trash" }),
        fetchContentFolders("asset"),
      ]);
      setAssets(nextAssets);
      setFolders(nextFolders);
      if (collection !== "trash") setLibraryAssets(nextAssets);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Media Library");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const selectCollection = (next: Collection) => { setCollection(next); setTagId(null); setSelectedIds(new Set()); setPage(1); };
  const selectTag = (next: string | null) => { setTagId(next); setCollection("all"); setPage(1); };
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleKind = (value: AssetKindFilter) => { setKind(value); setPage(1); };
  const toggleSelected = (id: string, checked: boolean) => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  const runBatch = async (mode: "trash" | "restore" | "delete", ids: string[]) => {
    if (!ids.length) return;
    setBatchBusy(true);
    const action = mode === "trash" ? trashMediaAsset : mode === "restore" ? restoreMediaAsset : permanentlyDeleteMediaAsset;
    const results = await Promise.allSettled(ids.map(action));
    const failed = results.filter((result) => result.status === "rejected").length;
    setSelectedIds(new Set());
    setError(failed ? `${failed} media item${failed === 1 ? "" : "s"} could not be updated.` : null);
    await refresh();
    setBatchBusy(false);
  };
  const moveSelected = async (targetFolderId: string | null) => {
    setBatchBusy(true);
    const results = await Promise.allSettled([...selectedIds].map((id) => moveMediaAsset(id, targetFolderId)));
    const failed = results.filter((result) => result.status === "rejected").length;
    setSelectedIds(new Set());
    setError(failed ? `${failed} media item${failed === 1 ? "" : "s"} could not be moved.` : null);
    await refresh();
    setBatchBusy(false);
  };

  const collectionName = isTrash ? "Trash" : folderId ? folders.find((folder) => folder.id === folderId)?.name ?? "Folder" : collection === "uncategorized" ? "Uncategorized" : "All Media";
  const emptyType = search || kind || tagId ? "search" : isTrash ? "trash" : folderId || collection === "uncategorized" ? "folder" : "library";
  // Only the aside instance is controlled by the header button (see LibraryRail.folders).
  const folderRail = (inAside: boolean) => (
    <FeatureFolderRail
      scope="asset"
      folders={folders}
      selected={collection}
      labels={{ all: "All Media", uncategorized: "Uncategorized", trash: "Trash" }}
      counts={isTrash ? undefined : counts}
      createOpen={inAside ? createFolderOpen : undefined}
      onCreateOpenChange={inAside ? setCreateFolderOpen : undefined}
      onSelect={selectCollection}
      onRefresh={() => void refresh()}
      onError={(reason) => setError(reason instanceof Error ? reason.message : "Unable to update folder")}
      deleteFolderItems={{
        loadIds: async (targetFolderId) => (await fetchMediaAssets({ folderId: targetFolderId })).map((asset) => asset.id),
        move: moveMediaAsset,
      }}
      isLoading={loading && folders.length === 0}
    />
  );
  const stats = { total: libraryAssets.length, images: libraryAssets.filter((asset) => asset.kind === "image").length, videos: libraryAssets.filter((asset) => asset.kind === "video").length };
  const pct = (n: number) => (stats.total ? `${((n / stats.total) * 100).toFixed(1)}% of total` : "—");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Media Library"
        subtitle="Manage and organize all your media assets."
        titleInTopbar
        actions={
          <>
            <Button variant="outline" size="sm" className="hidden xl:inline-flex" onClick={() => setCreateFolderOpen(true)}><Folder className="h-3.5 w-3" />Create Folder</Button>
            <Link href="/media-workspace/assets/upload" className={buttonVariants({ size: "sm" })}><Upload className="h-3.5 w-3" />Upload</Link>
          </>
        }
      />

      {loading && assets.length === 0 ? <LibrarySummarySkeleton count={5} /> : (
        <LibrarySummary
          label="Media summary"
          cards={[
            { label: "Total Files", value: stats.total, detail: "All media", icon: Archive },
            { label: "Images", value: stats.images, detail: pct(stats.images), icon: FileImage },
            { label: "Videos", value: stats.videos, detail: pct(stats.videos), icon: FileVideo },
            { label: "Audio", value: "—", detail: "Coming soon", icon: FileAudio, tone: "text-success bg-success-soft", disabled: true },
            { label: "Documents", value: "—", detail: "Coming soon", icon: FileText, tone: "text-warning bg-warning-soft", disabled: true },
          ]}
        />
      )}

      <LibraryShell
        toolbar={<LibraryToolbar search={search} onSearch={handleSearch} kind={kind} onKind={handleKind} isGrid={isGrid} onIsGrid={setIsGrid} />}
        selection={selectedIds.size > 0 && (
          <LibrarySelectionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
            {isTrash ? (
              <>
                <Button variant="outline" size="sm" disabled={batchBusy} onClick={() => void runBatch("restore", [...selectedIds])}><Undo2 className="h-3.5 w-3.5" />Restore</Button>
                <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => setPendingBatch({ mode: "delete", ids: [...selectedIds] })}><Trash2 className="h-3.5 w-3.5" />Delete Permanently</Button>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={batchBusy}><FolderInput className="h-3.5 w-3.5" />Move to Folder</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-64 w-44 overflow-y-auto">
                    <DropdownMenuItem onSelect={() => void moveSelected(null)}>Uncategorized</DropdownMenuItem>
                    {folders.map((folder) => <DropdownMenuItem key={folder.id} onSelect={() => void moveSelected(folder.id)}>{folder.name}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => setPendingBatch({ mode: "trash", ids: [...selectedIds] })}><Trash2 className="h-3.5 w-3.5" />Move to Trash</Button>
              </>
            )}
          </LibrarySelectionBar>
        )}
        rail={{ folders: folderRail, tags: <TagsRail tags={tags} selected={tagId} onSelect={selectTag} /> }}
        title={collectionName}
        meta={loading && assets.length === 0 ? "…" : `${filteredAssets.length.toLocaleString()} items`}
        headerActions={isTrash && assets.length > 0 && (
          <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => setPendingBatch({ mode: "delete", ids: assets.map((asset) => asset.id) })}>
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash
          </Button>
        )}
        footer={<LibraryPagination page={currentPage} totalPages={totalPages} total={filteredAssets.length} pageSize={PAGE_SIZE} onPage={setPage} />}
      >
        {error ? (
          <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p>
        ) : loading && assets.length === 0 ? (
          <LibraryGridSkeleton />
        ) : visibleAssets.length === 0 ? (
          <LibraryEmpty title={EMPTY_COPY[emptyType][0]} hint={EMPTY_COPY[emptyType][1]} />
        ) : (
          <div className={cn("grid gap-3", isGrid ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
            {visibleAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} trash={isTrash} folders={folders} onRefresh={() => void refresh()} previewUrl={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} selected={selectedIds.has(asset.id)} onSelect={(checked) => toggleSelected(asset.id, checked)} view={isGrid ? "grid" : "list"} />
            ))}
          </div>
        )}
      </LibraryShell>

      <AlertDialog open={pendingBatch !== null} onOpenChange={(open) => { if (!open) setPendingBatch(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingBatch?.mode === "delete" ? "Delete permanently?" : "Move to Trash?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBatch?.mode === "delete"
                ? `${pendingBatch.ids.length} item(s) will be permanently deleted. This cannot be undone.`
                : `${pendingBatch?.ids.length ?? 0} item(s) will be moved to Trash.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pendingBatch?.mode === "delete" ? "bg-danger hover:bg-danger" : undefined}
              onClick={() => {
                if (!pendingBatch) return;
                const { mode, ids } = pendingBatch;
                setPendingBatch(null);
                void runBatch(mode, ids);
              }}
            >
              {pendingBatch?.mode === "delete" ? "Delete Permanently" : "Move to Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
