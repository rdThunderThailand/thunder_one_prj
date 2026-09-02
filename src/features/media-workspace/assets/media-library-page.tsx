"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { GridIcon, ImageIcon, ListIcon, SearchIcon, TrashIcon, UploadIcon, VideoIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import {
  createContentFolder,
  deleteContentFolder,
  fetchContentFolders,
  fetchMediaAssetPage,
  moveContentFolder,
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  renameContentFolder,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import { ContentFolderRail, type FolderCollection } from "../content-library/ContentFolderRail";
import { isDescendant } from "../content-library/folder-tree";
import type { ContentFolder, MediaAsset, MediaAssetPage } from "@/types/domain";

type Collection = FolderCollection;
const EMPTY_PAGE: MediaAssetPage = { items: [], total: 0, page: 1, page_size: 12, stats: { total: 0, images: 0, videos: 0 } };

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function AssetCard({ asset, trash, folders, onRefresh }: { asset: MediaAsset; trash: boolean; folders: ContentFolder[]; onRefresh: () => void }) {
  const previews = usePreviewUrls([asset.id]);
  const [moving, setMoving] = useState(false);
  const label = asset.title ?? asset.file?.original_filename ?? "Untitled asset";
  const move = async (folderId: string | null) => {
    setMoving(true);
    try { await moveMediaAsset(asset.id, folderId); onRefresh(); } finally { setMoving(false); }
  };
  return <Card className="overflow-hidden">
    <Link href={`/media-workspace/assets/${asset.id}`} aria-label={`View ${label}`}>
      <MediaThumb url={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-36 w-full rounded-none" />
    </Link>
    <div className="space-y-2 p-3">
      <Link href={`/media-workspace/assets/${asset.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-300">{label}</Link>
      <p className="text-xs text-zinc-500">{asset.kind?.toUpperCase() ?? "FILE"} · {formatBytes(asset.file?.file_size_bytes)}</p>
      {trash ? <div className="flex gap-2"><button className="text-xs font-medium text-indigo-600" onClick={async () => { await restoreMediaAsset(asset.id); onRefresh(); }}>Restore</button><button className="text-xs font-medium text-red-600" onClick={async () => { if (window.confirm(`Permanently delete ${label}? This cannot be undone.`)) { await permanentlyDeleteMediaAsset(asset.id); onRefresh(); } }}>Delete forever</button></div> : <div className="flex items-center gap-2"><select aria-label={`Move ${label}`} disabled={moving} className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900" value={asset.folder_id ?? ""} onChange={(event) => void move(event.target.value || null)}><option value="">Uncategorized</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button aria-label={`Move ${label} to Trash`} className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600" onClick={async () => { if (window.confirm(`Move ${label} to Trash?`)) { await trashMediaAsset(asset.id); onRefresh(); } }}><TrashIcon /></button></div>}
    </div>
  </Card>;
}

function StatTilesSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Card key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-10" /></div></Card>)}</div>;
}

function AssetListSkeleton({ isGrid }: { isGrid: boolean }) {
  if (!isGrid) return <div className="space-y-3" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <Card key={i} className="overflow-hidden"><Skeleton className="h-36 w-full rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-full" /></div></Card>)}</div>;
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

  const folderId = collection !== "all" && collection !== "uncategorized" && collection !== "trash" ? collection : undefined;
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [nextAssets, nextFolders] = await Promise.all([
        fetchMediaAssetPage({ search, kind: kind || undefined, folderId, page, pageSize: 12, trash: collection === "trash" }),
        fetchContentFolders("asset"),
      ]);
      setAssets(collection === "uncategorized" ? { ...nextAssets, items: nextAssets.items.filter((asset) => !asset.folder_id) } : nextAssets);
      setFolders(nextFolders);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load Media Library"); }
    finally { setLoading(false); }
  }, [collection, folderId, kind, page, search]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 250); return () => window.clearTimeout(timer); }, [refresh]);

  const selectedFolder = folderId ?? null;
  const selectCollection = (next: Collection) => { setCollection(next); setPage(1); };
  const createFolder = async () => { if (!folderName.trim()) return; await createContentFolder("asset", { name: folderName, parent_id: selectedFolder }); setFolderName(""); setCreateOpen(false); await refresh(); };
  const openRename = (folder: ContentFolder) => { setFolderAction({ kind: "rename", folder }); setFolderActionValue(folder.name); };
  const openMove = (folder: ContentFolder) => { setFolderAction({ kind: "move", folder }); setFolderActionValue(""); };
  const deleteFolder = async (folder: ContentFolder) => {
    if (!window.confirm(`Delete folder ${folder.name}? It must be empty.`)) return;
    try { await deleteContentFolder(folder.id); if (collection === folder.id) selectCollection("all"); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete folder"); }
  };
  const submitFolderAction = async () => {
    if (!folderAction || (folderAction.kind === "rename" && !folderActionValue.trim())) return;
    setFolderActionBusy(true);
    try {
      if (folderAction.kind === "rename") await renameContentFolder(folderAction.folder.id, folderActionValue);
      else await moveContentFolder(folderAction.folder.id, folderActionValue || null);
      setFolderAction(null); setFolderActionValue(""); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update folder"); }
    finally { setFolderActionBusy(false); }
  };
  const moveTargets = folderAction?.kind === "move" ? folders.filter((folder) => folder.id !== folderAction.folder.id && !isDescendant(folders, folderAction.folder.id, folder.id)) : [];
  const statTiles = [{ label: "Total files", value: assets.stats.total, icon: "◫" }, { label: "Images", value: assets.stats.images, icon: <ImageIcon /> }, { label: "Videos", value: assets.stats.videos, icon: <VideoIcon /> }, { label: "Audio", value: "—", icon: "♪", disabled: true }, { label: "Documents", value: "—", icon: "▤", disabled: true }];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Media Library</h1><p className="mt-1 text-sm text-zinc-500">Manage and organize your media assets.</p></div><Link href="/media-workspace/assets/upload" className={buttonClasses()}><UploadIcon /> Upload</Link></div>
    {loading && assets.items.length === 0 ? <StatTilesSkeleton /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{statTiles.map((tile) => <Card key={tile.label} className={`flex items-center gap-3 p-4 ${tile.disabled ? "opacity-55" : ""}`}><span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/15">{tile.icon}</span><div><p className="text-xs text-zinc-500">{tile.label}</p><p className="text-2xl font-semibold">{tile.value}</p>{tile.disabled && <p className="text-[10px] text-zinc-400">Coming soon</p>}</div></Card>)}</div>}
    <Card className="flex h-[calc(100vh-345px)] min-h-[420px] flex-col overflow-hidden"><div className="flex shrink-0 flex-wrap gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"><label className="relative min-w-56 flex-1"><SearchIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search media..." className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"/></label><select value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setPage(1); }} className="rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"><option value="">All Types</option><option value="image">Images</option><option value="video">Videos</option></select><button disabled className="rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400 dark:border-zinc-700">Tags · Soon</button><button onClick={() => setIsGrid(true)} aria-pressed={isGrid} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"><GridIcon/></button><button onClick={() => setIsGrid(false)} aria-pressed={!isGrid} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"><ListIcon/></button></div><div className="grid min-h-0 flex-1 md:grid-cols-[230px_1fr]"><aside className="flex min-h-0 flex-col border-b border-zinc-200 p-3 dark:border-zinc-800 md:border-b-0 md:border-r"><p className="mb-2 shrink-0 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Folders</p><ContentFolderRail folders={folders} selected={collection} labels={{ all: "All Media", uncategorized: "Uncategorized", trash: "Trash" }} onSelect={selectCollection} onRename={openRename} onMove={openMove} onDelete={(folder) => void deleteFolder(folder)} isLoading={loading && folders.length === 0} footer={<Button type="button" variant="secondary" className="mt-2 w-full" onClick={() => setCreateOpen(true)}>Create Folder</Button>}/></aside><main className="flex min-h-0 flex-col p-5"><div className="mb-4 flex shrink-0 items-baseline justify-between"><div><h2 className="font-semibold">{collection === "trash" ? "Trash" : "All Media"}</h2>{loading && assets.items.length === 0 ? <Skeleton className="mt-2 h-4 w-16" /> : <p className="text-sm text-zinc-500">{assets.total.toLocaleString()} items</p>}</div></div><div className="min-h-0 flex-1 overflow-y-auto pr-1">{error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : loading && assets.items.length === 0 ? <AssetListSkeleton isGrid={isGrid} /> : assets.items.length === 0 ? <p className="py-20 text-center text-sm text-zinc-500">No media found.</p> : <div className={isGrid ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "space-y-3"}>{assets.items.map((asset) => <AssetCard key={asset.id} asset={asset} trash={collection === "trash"} folders={folders} onRefresh={() => void refresh()}/>)}</div>}</div><div className="mt-4 flex shrink-0 items-center justify-between border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800"><span>Page {assets.page} of {Math.max(1, Math.ceil(assets.total / assets.page_size))}</span><div className="flex gap-2"><Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="secondary" disabled={page * assets.page_size >= assets.total} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></main></div></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Folder" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => void createFolder()}>Create</Button></>}><label className="space-y-1"><span>Folder name</span><input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"/></label></Modal>
    <Modal open={folderAction !== null} onClose={() => setFolderAction(null)} title={folderAction?.kind === "rename" ? "Rename Folder" : "Move Folder"} footer={<><Button variant="secondary" onClick={() => setFolderAction(null)}>Cancel</Button><Button disabled={folderActionBusy || (folderAction?.kind === "rename" && !folderActionValue.trim())} onClick={() => void submitFolderAction()}>{folderActionBusy ? "Saving…" : "Save"}</Button></>}>
      {folderAction?.kind === "rename" ? <label className="space-y-1"><span>Folder name</span><input autoFocus value={folderActionValue} onChange={(event) => setFolderActionValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"/></label> : <label className="space-y-1"><span>Parent folder</span><select value={folderActionValue} onChange={(event) => setFolderActionValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">Root</option>{moveTargets.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
    </Modal>
  </div>;
}
