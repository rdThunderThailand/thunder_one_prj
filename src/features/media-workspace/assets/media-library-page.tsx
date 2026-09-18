"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Folder, FolderInput, Trash2, Undo2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
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
import { LibraryEmpty, LibraryGridSkeleton, LibraryPagination, LibrarySummary, LibrarySummarySkeleton } from "./components/LibraryChrome";
import { LibraryToolbar, type AssetKindFilter } from "./components/LibraryToolbar";

type Collection = FolderCollection;
const PAGE_SIZE = 12;
// Lovable `MediaFolderSidebar` tab: underline, no pill.
const railTabClass =
  "h-10 flex-1 rounded-none text-[10px] shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none";

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
  const [railOpen, setRailOpen] = useState(false);
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

  const selectCollection = (next: Collection) => { setCollection(next); setTagId(null); setSelectedIds(new Set()); setPage(1); setRailOpen(false); };
  const selectTag = (next: string | null) => { setTagId(next); setCollection("all"); setPage(1); setRailOpen(false); };
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleKind = (value: AssetKindFilter) => { setKind(value); setPage(1); };
  const toggleSelected = (id: string, checked: boolean) => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  const runBatch = async (mode: "trash" | "restore" | "delete", ids: string[]) => {
    if (!ids.length) return;
    const verb = mode === "trash" ? "Move" : mode === "restore" ? "Recover" : "Permanently delete";
    if (!window.confirm(`${verb} ${ids.length} media item${ids.length === 1 ? "" : "s"}?${mode === "delete" ? " This cannot be undone." : ""}`)) return;
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
  // The aside instance is the only one the header button controls: below `xl` the aside is
  // display:none, so a <dialog> inside it could not open — the drawer keeps its own footer button.
  const rail = (inAside: boolean) => (
    <Tabs defaultValue="folders" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="h-10 w-full shrink-0 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="folders" className={railTabClass}>Folders</TabsTrigger>
        <TabsTrigger value="tags" className={railTabClass}>Tags</TabsTrigger>
      </TabsList>
      <TabsContent value="folders" className="m-0 flex min-h-0 flex-1 flex-col p-2 data-[state=inactive]:hidden">
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
      </TabsContent>
      <TabsContent value="tags" className="m-0 flex min-h-0 flex-1 flex-col p-2 data-[state=inactive]:hidden">
        <TagsRail tags={tags} selected={tagId} onSelect={selectTag} />
      </TabsContent>
    </Tabs>
  );

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

      {loading && assets.length === 0 ? <LibrarySummarySkeleton /> : (
        <LibrarySummary total={libraryAssets.length} images={libraryAssets.filter((asset) => asset.kind === "image").length} videos={libraryAssets.filter((asset) => asset.kind === "video").length} />
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <LibraryToolbar search={search} onSearch={handleSearch} kind={kind} onKind={handleKind} isGrid={isGrid} onIsGrid={setIsGrid} onFolders={() => setRailOpen(true)} />

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary-soft px-3 py-2">
            <strong className="mr-2 text-[10px] text-primary">{selectedIds.size} selected</strong>
            {isTrash ? (
              <>
                <Button variant="outline" size="sm" disabled={batchBusy} onClick={() => void runBatch("restore", [...selectedIds])}><Undo2 className="h-3.5 w-3.5" />Recover</Button>
                <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => void runBatch("delete", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Delete forever</Button>
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
                <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => void runBatch("trash", [...selectedIds])}><Trash2 className="h-3.5 w-3.5" />Move to Trash</Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelectedIds(new Set())}><X className="h-3.5 w-3.5" />Clear Selection</Button>
          </div>
        )}

        <div className="grid min-h-155 xl:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border xl:flex xl:flex-col">{rail(true)}</aside>
          <div className="min-w-0 p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">{collectionName}</h2>
                <p className="mt-1 text-[9px] text-muted-foreground">{loading && assets.length === 0 ? "…" : `${filteredAssets.length.toLocaleString()} items`}</p>
              </div>
              {isTrash && assets.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={batchBusy} onClick={() => void runBatch("restore", assets.map((asset) => asset.id))}><Undo2 className="h-3.5 w-3.5" />Recover All</Button>
                  <Button variant="outline" size="sm" className="text-destructive" disabled={batchBusy} onClick={() => void runBatch("delete", assets.map((asset) => asset.id))}><Trash2 className="h-3.5 w-3.5" />Delete All</Button>
                </div>
              )}
            </div>

            {error ? (
              <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p>
            ) : loading && assets.length === 0 ? (
              <LibraryGridSkeleton />
            ) : visibleAssets.length === 0 ? (
              <LibraryEmpty type={emptyType} />
            ) : (
              <div className={cn("grid gap-3", isGrid ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
                {visibleAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} trash={isTrash} folders={folders} onRefresh={() => void refresh()} previewUrl={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} selected={selectedIds.has(asset.id)} onSelect={(checked) => toggleSelected(asset.id, checked)} view={isGrid ? "grid" : "list"} />
                ))}
              </div>
            )}
          </div>
        </div>

        <LibraryPagination page={currentPage} totalPages={totalPages} total={filteredAssets.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </section>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Library navigation</SheetTitle>
            <SheetDescription>Browse folders and tags.</SheetDescription>
          </SheetHeader>
          {rail(false)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
