"use client";

import Link from "next/link";
import { File, FileVideo, FolderInput, Image as ImageIcon, MoreHorizontal, Play, Trash2, Undo2 } from "lucide-react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import {
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import { cn } from "@/lib/utils";
import type { ContentFolder, MediaAsset } from "@/types/domain";

export function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function formatResolution(asset: MediaAsset) {
  return asset.width && asset.height ? `${asset.width}×${asset.height}` : "—";
}

export function formatFormat(asset: MediaAsset) {
  const ext = asset.file?.original_filename?.split(".").pop();
  return (ext && ext.length <= 4 ? ext : asset.file?.mime_type?.split("/")[1] ?? asset.kind ?? "file").toUpperCase();
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const total = Math.round(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

export const assetLabel = (asset: MediaAsset) => asset.title ?? asset.file?.original_filename ?? "Untitled asset";

/** Lovable `MediaMenu`, limited to the actions this repo actually has. */
export function AssetMenu({ asset, trash, folders, onRefresh }: {
  asset: MediaAsset;
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
}) {
  const label = assetLabel(asset);
  const move = async (folderId: string | null) => { await moveMediaAsset(asset.id, folderId); onRefresh(); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${label}`} onClick={(event) => event.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/media-workspace/assets/${asset.id}`}><File />View Details</Link>
        </DropdownMenuItem>
        {trash ? (
          <>
            <DropdownMenuItem onSelect={async () => { await restoreMediaAsset(asset.id); onRefresh(); }}><Undo2 />Restore</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={async () => {
                if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return;
                await permanentlyDeleteMediaAsset(asset.id);
                onRefresh();
              }}
            >
              <Trash2 />Delete forever
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><FolderInput />Move to Folder</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-64 w-44 overflow-y-auto">
                  <DropdownMenuItem disabled={!asset.folder_id} onSelect={() => void move(null)}>Uncategorized</DropdownMenuItem>
                  {folders.map((folder) => (
                    <DropdownMenuItem key={folder.id} disabled={asset.folder_id === folder.id} onSelect={() => void move(folder.id)}>{folder.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={async () => {
                if (!window.confirm(`Move ${label} to Trash?`)) return;
                await trashMediaAsset(asset.id);
                onRefresh();
              }}
            >
              <Trash2 />Move to Trash
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Lovable `Preview`: 16:9 thumb; videos get the play badge + duration. */
export function AssetPreview({ asset, previewUrl, thumbnailUrl }: { asset: MediaAsset; previewUrl?: string; thumbnailUrl?: string }) {
  const duration = formatDuration(asset.duration_seconds);
  return (
    <div className="relative aspect-video overflow-hidden bg-muted">
      <MediaThumb url={previewUrl} thumbnailUrl={thumbnailUrl} kind={asset.kind} mimeType={asset.file?.mime_type} alt={assetLabel(asset)} className="h-full w-full rounded-none" />
      {asset.kind === "video" && (
        <>
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <i className="grid h-9 w-9 place-items-center rounded-full bg-overlay text-primary-foreground"><Play className="ml-0.5 h-4 w-4 fill-current" /></i>
          </span>
          {duration && <span className="absolute bottom-2 right-2 rounded bg-overlay px-1.5 py-0.5 text-[8px] text-primary-foreground">{duration}</span>}
        </>
      )}
    </div>
  );
}

export function AssetCard({ asset, trash, folders, onRefresh, previewUrl, thumbnailUrl, selected, onSelect, view }: {
  asset: MediaAsset;
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
  // Signed once for the whole page by the list that owns these cards (ADR 0067).
  previewUrl?: string;
  thumbnailUrl?: string;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  view: "grid" | "list";
}) {
  const label = assetLabel(asset);
  const href = `/media-workspace/assets/${asset.id}`;
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card shadow-panel transition-[box-shadow,border-color] hover:border-foreground/20 hover:shadow-float",
        selected && "border-primary ring-1 ring-primary",
        view === "list" && "grid grid-cols-[150px_minmax(0,1fr)]",
      )}
    >
      <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 data-[selected=true]:opacity-100" data-selected={selected}>
        <Checkbox checked={selected} onCheckedChange={(value) => onSelect(value === true)} aria-label={`Select ${label}`} className="bg-card" />
      </div>
      <Link href={href} aria-label={`View ${label}`} className="block">
        <AssetPreview asset={asset} previewUrl={previewUrl} thumbnailUrl={thumbnailUrl} />
      </Link>
      <div className="flex items-start gap-2 p-2.5">
        <span className="mt-0.5 text-primary">{asset.kind === "video" ? <FileVideo className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}</span>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[10px] font-semibold hover:text-primary">{label}</Link>
          <p className="mt-1 truncate text-[8px] text-muted-foreground">
            {formatFormat(asset)} · {formatBytes(asset.file?.file_size_bytes)} · {formatDate(asset.created_at)}
          </p>
        </div>
        <AssetMenu asset={asset} trash={trash} folders={folders} onRefresh={onRefresh} />
      </div>
    </article>
  );
}
