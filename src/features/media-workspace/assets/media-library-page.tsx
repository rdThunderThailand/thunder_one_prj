"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageIcon, UploadIcon, VideoIcon } from "@/components/ui/icons";
import {
  createContentFolder,
  deleteContentFolder,
  fetchContentFolders,
  fetchMediaAssetPage,
  moveContentFolder,
  renameContentFolder,
} from "@/lib/api/media-api";
import { ContentFolderRail, type FolderCollection } from "../content-library/ContentFolderRail";
import { isDescendant } from "../content-library/folder-tree";
import type { ContentFolder, MediaAssetPage } from "@/types/domain";
import { AssetCard } from "./components/AssetCard";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { FolderActionModal } from "./components/FolderActionModal";
import { LibraryToolbar } from "./components/LibraryToolbar";

type Collection = FolderCollection;
const EMPTY_PAGE: MediaAssetPage = { items: [], total: 0, page: 1, page_size: 12, stats: { total: 0, images: 0, videos: 0 } };

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
  const [assets, setAssets] = useState<MediaAssetPage>(EMPTY_PAGE);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrid, setIsGrid] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderAction, setFolderAction] = useState<{ kind: "rename" | "move"; folder: ContentFolder } | null>(null);
  const [folderActionValue, setFolderActionValue] = useState("");
  const [folderActionBusy, setFolderActionBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const folderId = collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextAssets, nextFolders] = await Promise.all([
        fetchMediaAssetPage({ search, kind: kind || undefined, folderId, page, pageSize: 12, trash: collection === "trash" }),
        fetchContentFolders("asset"),
      ]);
      setAssets(collection === "uncategorized" ? { ...nextAssets, items: nextAssets.items.filter((asset) => !asset.folder_id) } : nextAssets);
      setFolders(nextFolders);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Media Library");
    } finally {
      setLoading(false);
    }
  }, [collection, folderId, kind, page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 250);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const selectedFolder = folderId ?? null;
  const selectCollection = (next: Collection) => { setCollection(next); setPage(1); };
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleKind = (value: "" | "image" | "video") => { setKind(value); setPage(1); };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    setCreateBusy(true);
    try {
      await createContentFolder("asset", { name: folderName, parent_id: selectedFolder });
      setFolderName("");
      setCreateOpen(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create folder");
    } finally {
      setCreateBusy(false);
    }
  };

  const openRename = (folder: ContentFolder) => { setFolderAction({ kind: "rename", folder }); setFolderActionValue(folder.name); };
  const openMove = (folder: ContentFolder) => { setFolderAction({ kind: "move", folder }); setFolderActionValue(""); };

  const deleteFolder = async (folder: ContentFolder) => {
    if (!window.confirm(`Delete folder ${folder.name}? It must be empty.`)) return;
    try {
      await deleteContentFolder(folder.id);
      if (collection === folder.id) selectCollection("all");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete folder");
    }
  };

  const submitFolderAction = async () => {
    if (!folderAction || (folderAction.kind === "rename" && !folderActionValue.trim())) return;
    setFolderActionBusy(true);
    try {
      if (folderAction.kind === "rename") await renameContentFolder(folderAction.folder.id, folderActionValue);
      else await moveContentFolder(folderAction.folder.id, folderActionValue || null);
      setFolderAction(null);
      setFolderActionValue("");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update folder");
    } finally {
      setFolderActionBusy(false);
    }
  };

  const moveTargets = folderAction?.kind === "move"
    ? folders.filter((folder) => folder.id !== folderAction.folder.id && !isDescendant(folders, folderAction.folder.id, folder.id))
    : [];

  const statTiles = [
    { label: "Total files", value: assets.stats.total, icon: "◫" },
    { label: "Images", value: assets.stats.images, icon: <ImageIcon /> },
    { label: "Videos", value: assets.stats.videos, icon: <VideoIcon /> },
    { label: "Audio", value: "—", icon: "♪", disabled: true },
    { label: "Documents", value: "—", icon: "▤", disabled: true },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage and organize your media assets.</p>
        </div>
        <Link href="/media-workspace/assets/upload" className={buttonClasses()}><UploadIcon /> Upload</Link>
      </div>

      {loading && assets.items.length === 0 ? (
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

      <Card className="flex h-[calc(100vh-345px)] min-h-[420px] flex-col overflow-hidden">
        <LibraryToolbar search={search} onSearch={handleSearch} kind={kind} onKind={handleKind} isGrid={isGrid} onIsGrid={setIsGrid} />

        <div className="grid min-h-0 flex-1 md:grid-cols-[230px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r">
            <p className="mb-2 shrink-0 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Folders</p>
            <ContentFolderRail
              folders={folders}
              selected={collection}
              labels={{ all: "All Media", uncategorized: "Uncategorized", trash: "Trash" }}
              onSelect={selectCollection}
              onRename={openRename}
              onMove={openMove}
              onDelete={(folder) => void deleteFolder(folder)}
              isLoading={loading && folders.length === 0}
              footer={<Button type="button" variant="secondary" className="mt-2 w-full" onClick={() => setCreateOpen(true)}>Create Folder</Button>}
            />
          </aside>

          <main className="flex min-h-0 flex-col p-5">
            <div className="mb-4 flex shrink-0 items-baseline justify-between">
              <div>
                <h2 className="font-semibold">{collection === "trash" ? "Trash" : "All Media"}</h2>
                {loading && assets.items.length === 0 ? (
                  <Skeleton className="mt-2 h-4 w-16" />
                ) : (
                  <p className="text-sm text-zinc-500">{assets.total.toLocaleString()} items</p>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {error ? (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              ) : loading && assets.items.length === 0 ? (
                <AssetListSkeleton isGrid={isGrid} />
              ) : assets.items.length === 0 ? (
                <p className="py-20 text-center text-sm text-zinc-500">No media found.</p>
              ) : (
                <div className={isGrid ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "space-y-3"}>
                  {assets.items.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} trash={collection === "trash"} folders={folders} onRefresh={() => void refresh()} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex shrink-0 items-center justify-between border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
              <span>Page {assets.page} of {Math.max(1, Math.ceil(assets.total / assets.page_size))}</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button variant="secondary" disabled={page * assets.page_size >= assets.total} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </main>
        </div>
      </Card>

      <CreateFolderModal
        open={createOpen}
        name={folderName}
        busy={createBusy}
        onNameChange={setFolderName}
        onCancel={() => setCreateOpen(false)}
        onCreate={() => void createFolder()}
      />

      <FolderActionModal
        action={folderAction}
        value={folderActionValue}
        busy={folderActionBusy}
        moveTargets={moveTargets}
        onValueChange={setFolderActionValue}
        onCancel={() => setFolderAction(null)}
        onSubmit={() => void submitFolderAction()}
      />
    </div>
  );
}
