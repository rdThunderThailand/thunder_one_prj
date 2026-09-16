"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { TrashIcon, UndoIcon } from "@/components/ui/icons";
import {
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";

export function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function formatResolution(asset: MediaAsset) {
  return asset.width && asset.height ? `${asset.width}×${asset.height}` : "—";
}

export function AssetActions({ asset, trash, folders, onRefresh, compact = false }: {
  asset: MediaAsset;
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
  compact?: boolean;
}) {
  const [moving, setMoving] = useState(false);
  const label = asset.title ?? asset.file?.original_filename ?? "Untitled asset";
  const move = async (folderId: string | null) => {
    setMoving(true);
    try {
      await moveMediaAsset(asset.id, folderId);
      onRefresh();
    } finally {
      setMoving(false);
    }
  };

  if (trash) return <div className="flex justify-end gap-1">
    <button aria-label={`Restore ${label}`} title="Restore" className={compact ? "grid h-8 w-8 place-items-center rounded-lg text-indigo-600 hover:bg-indigo-50" : "text-xs font-medium text-indigo-600"} onClick={async () => { await restoreMediaAsset(asset.id); onRefresh(); }}>
      {compact ? <UndoIcon /> : "Restore"}
    </button>
    <button aria-label={`Permanently delete ${label}`} title="Delete forever" className={compact ? "grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" : "text-xs font-medium text-red-600"} onClick={async () => {
      if (window.confirm(`Permanently delete ${label}? This cannot be undone.`)) {
        await permanentlyDeleteMediaAsset(asset.id);
        onRefresh();
      }
    }}>
      {compact ? <TrashIcon /> : "Delete forever"}
    </button>
  </div>;

  return <div className="flex items-center justify-end gap-2">
    <select aria-label={`Move ${label}`} disabled={moving} className={`${compact ? "w-40" : "min-w-0 flex-1"} rounded border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900`} value={asset.folder_id ?? ""} onChange={(event) => void move(event.target.value || null)}>
      <option value="">Uncategorized</option>
      {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
    </select>
    <button aria-label={`Move ${label} to Trash`} title="Move to Trash" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600" onClick={async () => {
      if (window.confirm(`Move ${label} to Trash?`)) {
        await trashMediaAsset(asset.id);
        onRefresh();
      }
    }}><TrashIcon /></button>
  </div>;
}

export function AssetCard({
  asset,
  trash,
  folders,
  onRefresh,
  previewUrl,
  thumbnailUrl,
}: {
  asset: MediaAsset;
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
  // Signed once for the whole page by the list that owns these cards (ADR 0067).
  previewUrl?: string;
  thumbnailUrl?: string;
}) {
  const label = asset.title ?? asset.file?.original_filename ?? "Untitled asset";

  return (
    <Card className="overflow-hidden">
      <Link href={`/media-workspace/assets/${asset.id}`} aria-label={`View ${label}`}>
        <MediaThumb
          url={previewUrl}
          thumbnailUrl={thumbnailUrl}
          kind={asset.kind}
          mimeType={asset.file?.mime_type}
          alt={label}
          className="h-36 w-full rounded-none"
        />
      </Link>
      <div className="space-y-2 p-3">
        <Link
          href={`/media-workspace/assets/${asset.id}`}
          className="block truncate text-sm font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-300"
        >
          {label}
        </Link>
        <p className="text-xs text-zinc-500">
          {asset.kind?.toUpperCase() ?? "FILE"} · {formatResolution(asset)} · {formatBytes(asset.file?.file_size_bytes)}
        </p>
        <AssetActions asset={asset} trash={trash} folders={folders} onRefresh={onRefresh} />
      </div>
    </Card>
  );
}
