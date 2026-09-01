"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { NoAccess } from "@/components/ui/NoAccess";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import {
  fetchContentFolders,
  fetchMediaAsset,
  moveMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { folderPath } from "../content-library/folder-tree";

function formatBytes(bytes?: number) {
  if (bytes == null) return "—";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB (${bytes.toLocaleString()} bytes)`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800"><dt className="text-zinc-500">{label}</dt><dd className="min-w-0 break-words font-medium text-zinc-800 dark:text-zinc-200">{value}</dd></div>;
}

function ComingSoon({ label, className = "" }: { label: string; className?: string }) {
  return <button type="button" disabled title="Coming soon" className={`rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-700 ${className}`}>{label}</button>;
}

function QuickActions({ onTrash }: { onTrash: () => void }) {
  const compactClassName = "w-full px-2 py-2 text-xs";
  return <Card className="p-4">
    <h2 className="mb-3 font-semibold">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2">
      <ComingSoon label="Add to Playlist" className={compactClassName} />
      <ComingSoon label="Add to Layout" className={compactClassName} />
      <ComingSoon label="Publish Now" className={compactClassName} />
      <ComingSoon label="Replace File" className={compactClassName} />
      <ComingSoon label="Duplicate" className={compactClassName} />
      <Button variant="secondary" onClick={onTrash} className="w-full px-2 py-2 text-xs text-red-600">Move to Trash</Button>
    </div>
  </Card>;
}

export function MediaDetailPage({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const previews = usePreviewUrls([assetId]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchMediaAsset(assetId), fetchContentFolders("asset")])
      .then(([nextAsset, nextFolders]) => {
        if (!alive) return;
        setAsset(nextAsset);
        setFolders(nextFolders);
      })
      .catch((reason) => alive && setError(classifyApiError(reason, "Unable to load media detail")));
    return () => { alive = false; };
  }, [assetId]);

  const label = asset?.title ?? asset?.file?.original_filename ?? "Untitled asset";
  const previewUrl = previews.urls[assetId];
  const thumbnailUrl = previews.thumbnailUrls[assetId];
  const dimensions = asset?.width && asset?.height ? `${asset.width} × ${asset.height}` : "—";
  const aspectRatio = useMemo(() => {
    if (!asset?.width || !asset.height) return "—";
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const divisor = gcd(asset.width, asset.height);
    return `${asset.width / divisor}:${asset.height / divisor}`;
  }, [asset?.height, asset?.width]);

  if (error?.kind === "forbidden") return <NoAccess message={error.message} />;
  if (error) return <div className="space-y-4 py-16 text-center"><p className={error.kind === "not-found" ? "text-zinc-500" : "text-red-600"}>{error.message}</p><Link href="/media-workspace/assets" className={buttonClasses("secondary")}>Back to Media Library</Link></div>;
  if (!asset) return <p className="py-16 text-center text-sm text-zinc-500">Loading media…</p>;

  const move = async (folderId: string | null) => {
    setIsMoving(true);
    try {
      await moveMediaAsset(asset.id, folderId);
      setAsset({ ...asset, folder_id: folderId });
    } finally {
      setIsMoving(false);
    }
  };

  const trash = async () => {
    if (!window.confirm(`Move ${label} to Trash?`)) return;
    await trashMediaAsset(asset.id);
    router.push("/media-workspace/assets");
  };

  return <div className="space-y-4">
    <div className="text-xs text-zinc-500"><Link href="/media-workspace/assets" className="hover:text-indigo-600">Media Library</Link><span className="mx-2">/</span>{label}</div>
    <PageHeader title="Media Detail" subtitle={label} actions={<div className="flex flex-wrap gap-2">{previewUrl ? <a href={previewUrl} download={asset.file?.original_filename} className={buttonClasses("secondary")}>Download</a> : <Button variant="secondary" disabled>Download</Button>}<ComingSoon label="More" /></div>} />

    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-4">
        <Card className="grid overflow-hidden p-0 lg:h-[394px] lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,1fr)]">
          <div className="min-h-64 bg-zinc-950 lg:h-full lg:min-h-0">
            {asset.kind === "video" && previewUrl ? <video src={previewUrl} controls poster={thumbnailUrl} className="h-full w-full object-contain" /> : <MediaThumb url={previewUrl} thumbnailUrl={thumbnailUrl} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-full w-full rounded-none object-contain" />}
          </div>
          <div className="space-y-5 p-5">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{label}</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium capitalize text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{asset.status ?? "ready"}</span></div><p className="mt-2 text-sm text-zinc-500">{asset.kind?.toUpperCase() ?? "FILE"} · {asset.file?.mime_type ?? "Unknown type"}</p></div>
            <dl><Fact label="Uploaded by" value={asset.created_by?.display_name ?? "—"} /><Fact label="Uploaded on" value={formatDate(asset.created_at)} /><Fact label="Dimensions" value={dimensions} /><Fact label="Duration" value={formatDuration(asset.duration_seconds)} /><Fact label="Folder" value={folderPath(folders, asset.folder_id)} /><Fact label="File ID" value={asset.file?.id ?? "—"} /><Fact label="Source" value="Uploaded" /></dl>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex gap-6 border-b border-zinc-200 px-5 dark:border-zinc-800"><button className="border-b-2 border-indigo-600 py-3 text-sm font-medium text-indigo-600">Overview</button>{["Metadata", "Versions", "Activity History"].map((tab) => <button key={tab} disabled title="Coming soon" className="py-3 text-sm text-zinc-400">{tab}</button>)}</div>
          <div className="grid gap-5 p-4 lg:grid-cols-2">
            <section><h3 className="mb-2 font-semibold">File Information</h3><dl><Fact label="File name" value={asset.file?.original_filename ?? "—"} /><Fact label="File type" value={asset.file?.mime_type ?? "—"} /><Fact label="File size" value={formatBytes(asset.file?.file_size_bytes)} /><Fact label="Dimensions" value={dimensions} /><Fact label="Created on" value={formatDate(asset.created_at)} /><Fact label="Last modified" value={formatDate(asset.updated_at)} /></dl></section>
            <section><h3 className="mb-2 font-semibold">Technical Information</h3><dl><Fact label="Resolution" value={dimensions} /><Fact label="Aspect ratio" value={aspectRatio} /><Fact label="Codec" value={asset.codec ?? "—"} /><Fact label="Checksum" value={asset.file?.checksum ?? "—"} /></dl></section>
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="flex min-h-[394px] flex-col p-0 xl:h-[394px]"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800"><h2 className="font-semibold">Usage (Where it&apos;s used)</h2><span className="text-xs text-zinc-400">Coming soon</span></div><div className="flex flex-1 items-center p-5"><p className="w-full rounded-lg bg-zinc-50 p-4 text-sm leading-5 text-zinc-500 dark:bg-zinc-800/60">Usage counts will appear when a tenant-scoped usage contract is available.</p></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Tags</h2><span className="text-xs text-zinc-400">Coming soon</span></div><p className="mt-3 text-sm text-zinc-500">Asset tags are not available yet.</p></Card>
        <Card className="p-4"><h2 className="font-semibold">Move to Folder</h2><select aria-label={`Move ${label}`} value={asset.folder_id ?? ""} disabled={isMoving} onChange={(event) => void move(event.target.value || null)} className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"><option value="">Uncategorized</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></Card>
        <QuickActions onTrash={() => void trash()} />
      </aside>
    </div>
  </div>;
}
