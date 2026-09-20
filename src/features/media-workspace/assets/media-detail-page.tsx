"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/lovable/badge";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { NoAccess } from "@/components/ui/NoAccess";
import { EditIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { verdictMessage } from "@/features/media-workspace/assets/upload/verdict-message";
import {
  fetchContentFolders,
  fetchMediaAsset,
  moveMediaAsset,
  renameMediaAsset,
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
  return <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-border py-2 text-sm last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-medium text-foreground">{value}</dd></div>;
}

function ComingSoon({ label, className = "" }: { label: string; className?: string }) {
  return (
    <Button variant="outline" disabled title="Coming soon" className={className}>
      {label}
    </Button>
  );
}

function QuickActions({ onTrash }: { onTrash: () => void }) {
  const compactClassName = "w-full px-2 py-2 text-xs";
  return <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
    <h2 className="mb-3 font-semibold">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2">
      <ComingSoon label="Add to Playlist" className={compactClassName} />
      <ComingSoon label="Add to Layout" className={compactClassName} />
      <ComingSoon label="Publish Now" className={compactClassName} />
      <ComingSoon label="Replace File" className={compactClassName} />
      <ComingSoon label="Duplicate" className={compactClassName} />
      <Button variant="outline" onClick={onTrash} className="w-full px-2 py-2 text-xs text-danger">
        <Trash2 className="h-3.5 w-3.5" />
        Move to Trash
      </Button>
    </div>
  </section>;
}

export function MediaDetailPage({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
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
  if (error) return <div className="space-y-4 py-16 text-center"><p className={error.kind === "not-found" ? "text-muted-foreground" : "text-danger"}>{error.message}</p><Link href="/media-workspace/assets" className={buttonVariants({ variant: "secondary" })}>Back to Media Library</Link></div>;
  if (!asset) return <p className="py-16 text-center text-sm text-muted-foreground">Loading media…</p>;

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
    await trashMediaAsset(asset.id);
    router.push("/media-workspace/assets");
  };

  const rename = async () => {
    const title = draftTitle.trim();
    if (!title || title.length > 200 || title === label) {
      if (title === label) setIsRenaming(false);
      else setRenameError(title ? "Name must be 200 characters or fewer." : "Name is required.");
      return;
    }
    setRenameError("");
    try {
      await renameMediaAsset(asset.id, title);
      setAsset({ ...asset, title, updated_at: new Date().toISOString() });
      setIsRenaming(false);
    } catch (reason) {
      setRenameError(classifyApiError(reason, "Unable to rename media").message);
    }
  };

  return <div className="space-y-4">
    <PageHeader
      title="Media Detail"
      subtitle="Inspect and manage a single media asset."
      titleInTopbar
      actions={<div className="flex flex-wrap gap-2">{previewUrl ? <a href={previewUrl} download={asset.file?.original_filename} className={buttonVariants({ variant: "outline", size: "sm" })}><Download className="h-3.5 w-3.5" />Download</a> : <Button variant="outline" size="sm" disabled>Download</Button>}<ComingSoon label="More" className="h-8 text-xs" /></div>}
    />
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/media-workspace/assets" className="hover:text-foreground">Media Library</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="truncate text-foreground">{label}</span>
    </nav>
    <div>
      <h1 className="text-xl font-bold text-foreground">Media Detail</h1>
      <Link href="/media-workspace/assets" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
        <ArrowLeft className="h-3 w-3" />
        Back to Media Library
      </Link>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <section className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-panel lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <div className="min-h-64 overflow-hidden rounded-lg border border-border bg-foreground lg:min-h-0">
            {asset.kind === "video" && previewUrl ? <video src={previewUrl} controls poster={thumbnailUrl} className="h-full w-full object-contain" /> : <MediaThumb url={previewUrl} thumbnailUrl={thumbnailUrl} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-full w-full rounded-none object-contain" />}
          </div>
          <div className="space-y-5 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isRenaming ? <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(event) => { event.preventDefault(); void rename(); }}>
                  <Input autoFocus aria-label="Media name" value={draftTitle} maxLength={200} onChange={(event) => { setDraftTitle(event.target.value); setRenameError(""); }} onKeyDown={(event) => { if (event.key === "Escape") { setIsRenaming(false); setRenameError(""); } }} className="min-w-0 flex-1 border-primary text-base font-semibold ring-2 ring-primary/30" />
                  <Button type="submit" className="px-3 py-2">Save</Button>
                  <Button type="button" variant="secondary" className="px-3 py-2" onClick={() => { setIsRenaming(false); setRenameError(""); }}>Cancel</Button>
                </form> : <>
                  <h2 className="min-w-0 break-words text-xl font-semibold text-foreground">{label}</h2>
                  <button type="button" aria-label="Rename media" title="Rename media" onClick={() => { setDraftTitle(label); setIsRenaming(true); setRenameError(""); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"><EditIcon /></button>
                </>}
                <Badge variant={asset.status === "failed" ? "danger" : "success"} className="capitalize">{asset.status ?? "ready"}</Badge>
                {asset.status !== "failed" && asset.rendition?.present && <Badge variant="info">แปลงแล้ว</Badge>}
              </div>
              {/* ADR 0071: `processing` is a background conversion in progress, not a refusal — the
                  ADR 0070 verdict sentence would misdescribe it. `failed` is a refusal and always
                  keeps its reason, even if a stale Rendition record exists. A present Rendition on
                  a non-failed Asset means the source finding is resolved, so the profile warning
                  no longer applies. */}
              {asset.status === "processing" ? (
                <p className="mt-2 text-sm text-warning">กำลังแปลง — รีเฟรชเพื่อดูสถานะ</p>
              ) : (
                (asset.status === "failed" || !asset.rendition?.present) && verdictMessage(asset.probe_verdict) && (
                  <p className={`mt-2 text-sm ${asset.status === "failed" ? "text-danger" : "text-warning"}`}>{verdictMessage(asset.probe_verdict)}</p>
                )
              )}
              {renameError && <p role="alert" className="mt-2 text-sm text-danger">{renameError}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{asset.kind?.toUpperCase() ?? "FILE"} · {asset.file?.mime_type ?? "Unknown type"}</p>
            </div>
            <dl><Fact label="Uploaded by" value={asset.created_by?.display_name ?? "—"} /><Fact label="Uploaded on" value={formatDate(asset.created_at)} /><Fact label="Dimensions" value={dimensions} /><Fact label="Duration" value={formatDuration(asset.duration_seconds)} /><Fact label="Folder" value={folderPath(folders, asset.folder_id)} /><Fact label="File ID" value={asset.file?.id ?? "—"} /><Fact label="Source" value="Uploaded" /></dl>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
          <div className="flex gap-6 border-b border-border px-5"><button className="border-b-2 border-primary py-3 text-sm font-medium text-primary">Overview</button>{["Metadata", "Versions", "Activity History"].map((tab) => <button key={tab} disabled title="Coming soon" className="py-3 text-sm text-muted-foreground">{tab}</button>)}</div>
          <div className="grid gap-5 p-4 lg:grid-cols-2">
            <section><h3 className="mb-2 font-semibold">File Information</h3><dl><Fact label="File name" value={asset.file?.original_filename ?? "—"} /><Fact label="File type" value={asset.file?.mime_type ?? "—"} /><Fact label="File size" value={formatBytes(asset.file?.file_size_bytes)} /><Fact label="Dimensions" value={dimensions} /><Fact label="Created on" value={formatDate(asset.created_at)} /><Fact label="Last modified" value={formatDate(asset.updated_at)} /></dl></section>
            <section><h3 className="mb-2 font-semibold">Technical Information</h3><dl><Fact label="Resolution" value={dimensions} /><Fact label="Aspect ratio" value={aspectRatio} /><Fact label="Codec" value={asset.codec ?? "—"} /><Fact label="Checksum" value={asset.file?.checksum ?? "—"} /></dl></section>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="flex min-h-[260px] flex-col rounded-xl border border-border bg-card shadow-panel"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-semibold">Usage (Where it&apos;s used)</h2><Badge variant="neutral">Coming soon</Badge></div><div className="flex flex-1 items-center p-5"><p className="w-full rounded-lg bg-muted p-4 text-sm leading-5 text-muted-foreground">Usage counts will appear when a tenant-scoped usage contract is available.</p></div></section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-panel"><h2 className="font-semibold">Tags</h2>{asset.tags?.length ? <div className="mt-3 flex flex-wrap gap-2">{asset.tags.map((tag) => <Badge key={tag.id} variant="secondary">{tag.name}</Badge>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No tags assigned.</p>}</section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-panel"><h2 className="font-semibold">Move to Folder</h2><select aria-label={`Move ${label}`} value={asset.folder_id ?? ""} disabled={isMoving} onChange={(event) => void move(event.target.value || null)} className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"><option value="">Uncategorized</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></section>
        <QuickActions onTrash={() => setTrashOpen(true)} />
      </aside>
    </div>
    <AlertDialog open={trashOpen} onOpenChange={setTrashOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
          <AlertDialogDescription>Move {label} to Trash?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void trash()}>Move to Trash</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
