"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageIcon, UploadIcon, VideoIcon } from "@/components/ui/icons";
import {
  fetchContentFolders,
  fetchMediaAssets,
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { FeatureFolderRail } from "../content-library/FeatureFolderRail";
import { TagsRail } from "../content-library/TagsRail";
import { filterByTag, tagCounts } from "../content-library/tag-filtering";
import type { FolderCollection } from "../content-library/ContentFolderRail";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { AssetCard } from "./components/AssetCard";
import { AssetTable } from "./components/AssetTable";
import { LibraryToolbar } from "./components/LibraryToolbar";

type Collection = FolderCollection;
const PAGE_SIZE = 12;
const railTabClass = (active: boolean) =>
  `rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide ${active ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`;

function StatTilesSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-10" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function AssetListSkeleton({ isGrid }: { isGrid: boolean }) {
  if (!isGrid) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MediaLibraryPage() {
  const [collection, setCollection] = useState<Collection>("all");
  const [kind, setKind] = useState<"" | "image" | "video">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrid, setIsGrid] = useState(true);
  const [railTab, setRailTab] = useState<"folders" | "tags">("folders");
  const [tagId, setTagId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  const folderId = collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined;
  const tags = useMemo(() => tagCounts(assets), [assets]);
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
  const previewIds = useMemo(
    () => [...new Set(visibleAssets.map((asset) => asset.id))],
    [visibleAssets]
  );
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
  const handleKind = (value: "" | "image" | "video") => { setKind(value); setPage(1); };
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

  const statTiles = [
    { label: "Total files", value: assets.length, icon: "◫" },
    { label: "Images", value: assets.filter((asset) => asset.kind === "image").length, icon: <ImageIcon /> },
    { label: "Videos", value: assets.filter((asset) => asset.kind === "video").length, icon: <VideoIcon /> },
    { label: "Audio", value: "—", icon: "♪", disabled: true },
    { label: "Documents", value: "—", icon: "▤", disabled: true },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6">
      <PageHeader
        title="Media Library"
        subtitle="Manage and organize your media assets."
        actions={<Link href="/media-workspace/assets/upload" className={buttonClasses()}><UploadIcon /> Upload</Link>}
      />

      {loading && assets.length === 0 ? (
        <StatTilesSkeleton />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {statTiles.map((tile) => (
            <Card key={tile.label} className={`flex items-center gap-3 p-4 ${tile.disabled ? "opacity-55" : ""}`}>
              <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/15">{tile.icon}</span>
              <div>
                <p className="text-xs text-zinc-500">{tile.label}</p>
                <p className="text-2xl font-semibold">{tile.value}</p>
                {tile.disabled && <p className="text-[10px] text-zinc-400">Coming soon</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex min-h-[420px] flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 md:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r">
            <div className="mb-2 flex shrink-0 gap-1 px-1">
              <button type="button" className={railTabClass(railTab === "folders")} onClick={() => setRailTab("folders")}>Folders</button>
              <button type="button" className={railTabClass(railTab === "tags")} onClick={() => setRailTab("tags")}>Tags</button>
            </div>
            {railTab === "folders" ? <FeatureFolderRail
              scope="asset"
              folders={folders}
              selected={collection}
              labels={{ all: "All Media", uncategorized: "Uncategorized", trash: "Trash" }}
              onSelect={selectCollection}
              onRefresh={() => void refresh()}
              onError={(reason) => setError(reason instanceof Error ? reason.message : "Unable to update folder")}
              deleteFolderItems={{
                loadIds: async (targetFolderId) => (await fetchMediaAssets({ folderId: targetFolderId })).map((asset) => asset.id),
                move: moveMediaAsset,
              }}
              isLoading={loading && folders.length === 0}
            /> : <TagsRail tags={tags} selected={tagId} onSelect={selectTag} />}
          </aside>

          <main className="flex min-h-0 flex-col p-5">
            <LibraryToolbar search={search} onSearch={handleSearch} kind={kind} onKind={handleKind} isGrid={isGrid} onIsGrid={setIsGrid} />
            <div className="mb-4 flex shrink-0 items-baseline justify-between">
              <div>
                <h2 className="font-semibold">{collection === "trash" ? "Trash" : "All Media"}</h2>
                {loading && assets.length === 0 ? (
                  <Skeleton className="mt-2 h-4 w-16" />
                ) : (
                  <p className="text-sm text-zinc-500">{filteredAssets.length.toLocaleString()} items</p>
                )}
              </div>
              <div className="flex gap-2">
                {collection === "trash" ? <>
                  <Button variant="secondary" disabled={batchBusy || assets.length === 0} onClick={() => void runBatch("restore", assets.map((asset) => asset.id))}>Recover All</Button>
                  <Button disabled={batchBusy || assets.length === 0} className="bg-red-600 hover:bg-red-500" onClick={() => void runBatch("delete", assets.map((asset) => asset.id))}>Delete All</Button>
                </> : selectedIds.size > 0 ? <Button disabled={batchBusy} className="bg-red-600 hover:bg-red-500" onClick={() => void runBatch("trash", [...selectedIds])}>Move {selectedIds.size} to Trash</Button> : null}
                {collection === "trash" && selectedIds.size > 0 && <><Button variant="secondary" disabled={batchBusy} onClick={() => void runBatch("restore", [...selectedIds])}>Recover Selected</Button><Button disabled={batchBusy} className="bg-red-600 hover:bg-red-500" onClick={() => void runBatch("delete", [...selectedIds])}>Delete Selected</Button></>}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {error ? (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              ) : loading && assets.length === 0 ? (
                <AssetListSkeleton isGrid={isGrid} />
              ) : visibleAssets.length === 0 ? (
                <p className="py-20 text-center text-sm text-zinc-500">No media found.</p>
              ) : isGrid ? (
                <div className={isGrid ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "space-y-3"}>
                  {visibleAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} trash={collection === "trash"} folders={folders} onRefresh={() => void refresh()} previewUrl={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} />
                  ))}
                </div>
              ) : (
                <AssetTable assets={visibleAssets} trash={collection === "trash"} folders={folders} onRefresh={() => void refresh()} previewUrls={previews.urls} thumbnailUrls={previews.thumbnailUrls} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
              )}
            </div>

          </main>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-5 py-4 text-sm dark:border-zinc-800">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            <Button variant="secondary" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
