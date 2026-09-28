"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Folder,
  FolderInput,
  Image as ImageIcon,
  Link2,
  Maximize2,
  MoreHorizontal,
  Ratio,
  RefreshCw,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/lovable/badge";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { NoAccess } from "@/components/ui/NoAccess";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { verdictMessage } from "@/features/media-workspace/assets/upload/verdict-message";
import { fetchContentFolders, fetchMediaAsset } from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { folderPath } from "../content-library/folder-tree";
import { FullscreenDialog, MoveToFolderDialog, TrashDialog } from "./media-detail-dialogs";
import { InlineRename } from "./media-detail-rename";
import { KindIcon, MediaPreview, SectionCard, assetLabel, formatBytes, formatDate, formatDuration, type Icon } from "./media-detail-preview";

function UsagePanel() {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-panel" aria-label="Usage">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">Usage (Where it&apos;s used)</h2>
        <Badge variant="neutral">Coming soon</Badge>
      </div>
      <p className="mt-3 rounded-lg bg-muted p-3 text-[11px] leading-5 text-muted-foreground">Usage counts will appear when a tenant-scoped usage contract is available.</p>
    </section>
  );
}

export function MediaDetailPage({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [dialog, setDialog] = useState<"move" | "trash" | "fullscreen" | null>(null);
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

  const previewUrl = previews.urls[assetId];
  const thumbnailUrl = previews.thumbnailUrls[assetId];
  const dimensions = asset?.width && asset?.height ? `${asset.width} × ${asset.height}` : undefined;
  const aspectRatio = useMemo(() => {
    if (!asset?.width || !asset.height) return undefined;
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const divisor = gcd(asset.width, asset.height);
    return `${asset.width / divisor}:${asset.height / divisor}`;
  }, [asset?.height, asset?.width]);

  if (error?.kind === "forbidden") return <NoAccess message={error.message} />;
  if (error) return <div className="space-y-4 py-16 text-center"><p className={error.kind === "not-found" ? "text-muted-foreground" : "text-danger"}>{error.message}</p><Link href="/media-workspace/assets" className={buttonVariants({ variant: "secondary" })}>Back to Media Library</Link></div>;
  if (!asset) return <p className="py-16 text-center text-sm text-muted-foreground">Loading media…</p>;

  const label = assetLabel(asset);
  const kindLabel = asset.kind ? asset.kind.charAt(0).toUpperCase() + asset.kind.slice(1) : "File";
  const mime = asset.file?.mime_type ?? "Unknown type";
  const size = asset.file?.file_size_bytes != null ? `${(asset.file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "—";
  const verdict = asset.status === "failed" || !asset.rendition?.present ? verdictMessage(asset.probe_verdict) : undefined;
  const facts: Array<[Icon, string, string]> = [
    [User, "Uploaded by", asset.created_by?.display_name ?? "—"],
    [Calendar, "Uploaded on", formatDate(asset.created_at)],
    [Ratio, "Dimensions", dimensions ?? "—"],
    [Folder, "Folder", folderPath(folders, asset.folder_id)],
    [Link2, "Source", "Uploaded"],
  ];

  return (
    <div>
      <PageHeader title="Media Detail" subtitle="Inspect and manage a single media asset." titleInTopbar />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Link href="/media-workspace/assets" className="hover:text-foreground">Media Library</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/media-workspace/assets" className="hover:text-foreground">All Media</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-semibold text-foreground">{label}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Media Detail</h1>
          <Link href="/media-workspace/assets" className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Media Library
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl ? (
            <a href={previewUrl} download={asset.file?.original_filename} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-3.5 w-3.5" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem disabled title="Coming soon">
                <RefreshCw />
                Replace File
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("move")}>
                <FolderInput />
                Move to Folder
              </DropdownMenuItem>
              <DropdownMenuItem disabled title="Coming soon">
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog("trash")}>
                <Trash2 />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-panel lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-lg border border-border">
            <MediaPreview asset={asset} previewUrl={previewUrl} thumbnailUrl={thumbnailUrl} />
            <Button variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8" aria-label="Fullscreen preview" onClick={() => setDialog("fullscreen")}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <KindIcon asset={asset} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <InlineRename key={label} asset={asset} onRenamed={(title) => setAsset({ ...asset, title, updated_at: new Date().toISOString() })} />
                <p className="mt-1 text-[11px] text-muted-foreground">{kindLabel} · {mime} · {size}</p>
              </div>
            </div>
            {/* ADR 0071: `processing` is a background conversion in progress, not a refusal — the
                ADR 0070 verdict sentence would misdescribe it. `failed` is a refusal and always
                keeps its reason, even if a stale Rendition record exists. A present Rendition on
                a non-failed Asset means the source finding is resolved, so the profile warning
                no longer applies. */}
            {asset.status === "processing" ? (
              <p className="mt-3 text-xs text-warning">กำลังแปลง — รีเฟรชเพื่อดูสถานะ</p>
            ) : (
              verdict && <p className={`mt-3 text-xs ${asset.status === "failed" ? "text-danger" : "text-warning"}`}>{verdict}</p>
            )}
            {asset.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="bg-muted text-[10px] font-semibold text-foreground">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-4 divide-y divide-border border-t border-border">
              {facts.map(([Ico, factLabel, value]) => (
                <div key={factLabel} className="flex items-center justify-between gap-4 py-2.5 text-[11px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Ico className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {factLabel}
                  </span>
                  <strong className="min-w-0 truncate">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div id="media-usage">
          <UsagePanel />
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-border bg-card p-4 shadow-panel">
        <h2 className="text-sm font-bold">Metadata</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">Detailed information about this media file.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <SectionCard
            title="File Information"
            icon={FileText}
            rows={[
              ["File Name", asset.file?.original_filename],
              ["File Type", asset.file?.mime_type],
              ["File Size", formatBytes(asset.file?.file_size_bytes)],
              ["File ID", asset.file?.id],
              ["Created On", formatDate(asset.created_at)],
              ["Last Modified", formatDate(asset.updated_at)],
            ]}
          />
          <SectionCard
            title={asset.kind === "image" ? "Image Properties" : "Media Properties"}
            icon={ImageIcon}
            rows={[
              ["Resolution", dimensions],
              ["Aspect Ratio", aspectRatio],
              ["Codec", asset.codec],
              ["Format", asset.file?.mime_type],
              ["Duration", asset.kind === "image" ? undefined : formatDuration(asset.duration_seconds)],
            ]}
          />
          <SectionCard
            title="Additional Information"
            icon={Tag}
            rows={[
              ["Folder Path", `/ ${folderPath(folders, asset.folder_id)}`],
              ["Tags", asset.tags?.map((tag) => tag.name).join(", ")],
              ["Checksum", asset.file?.checksum],
            ]}
          />
        </div>
      </section>

      <MoveToFolderDialog asset={asset} folders={folders} thumbnailUrl={thumbnailUrl} open={dialog === "move"} onOpenChange={(v) => setDialog(v ? "move" : null)} onMoved={(folderId) => setAsset({ ...asset, folder_id: folderId })} />
      <TrashDialog asset={asset} open={dialog === "trash"} onOpenChange={(v) => setDialog(v ? "trash" : null)} />
      <FullscreenDialog asset={asset} previewUrl={previewUrl} thumbnailUrl={thumbnailUrl} open={dialog === "fullscreen"} onOpenChange={(v) => setDialog(v ? "fullscreen" : null)} />
    </div>
  );
}
