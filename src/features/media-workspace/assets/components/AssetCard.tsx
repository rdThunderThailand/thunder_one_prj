"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { TrashIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import {
  moveMediaAsset,
  permanentlyDeleteMediaAsset,
  restoreMediaAsset,
  trashMediaAsset,
} from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function AssetCard({
  asset,
  trash,
  folders,
  onRefresh,
}: {
  asset: MediaAsset;
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
}) {
  const previews = usePreviewUrls([asset.id]);
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

  return (
    <Card className="overflow-hidden">
      <Link href={`/media-workspace/assets/${asset.id}`} aria-label={`View ${label}`}>
        <MediaThumb
          url={previews.urls[asset.id]}
          thumbnailUrl={previews.thumbnailUrls[asset.id]}
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
          {asset.kind?.toUpperCase() ?? "FILE"} · {formatBytes(asset.file?.file_size_bytes)}
        </p>
        {trash ? (
          <div className="flex gap-2">
            <button
              className="text-xs font-medium text-indigo-600"
              onClick={async () => {
                await restoreMediaAsset(asset.id);
                onRefresh();
              }}
            >
              Restore
            </button>
            <button
              className="text-xs font-medium text-red-600"
              onClick={async () => {
                if (window.confirm(`Permanently delete ${label}? This cannot be undone.`)) {
                  await permanentlyDeleteMediaAsset(asset.id);
                  onRefresh();
                }
              }}
            >
              Delete forever
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              aria-label={`Move ${label}`}
              disabled={moving}
              className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              value={asset.folder_id ?? ""}
              onChange={(event) => void move(event.target.value || null)}
            >
              <option value="">Uncategorized</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button
              aria-label={`Move ${label} to Trash`}
              className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600"
              onClick={async () => {
                if (window.confirm(`Move ${label} to Trash?`)) {
                  await trashMediaAsset(asset.id);
                  onRefresh();
                }
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
