"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ArrowRightIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchMediaAssetPage } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";

function assetLabel(asset: MediaAsset) {
  return asset.title ?? asset.file?.original_filename ?? "Untitled asset";
}

export function RecentUploadsCard({ completedCount }: { completedCount: number }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previews = usePreviewUrls(assets.map((asset) => asset.id));

  useEffect(() => {
    let cancelled = false;
    fetchMediaAssetPage({ page: 1 })
      .then((page) => {
        if (cancelled) return;
        setAssets(page.items.slice(0, 3));
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load recent uploads.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [completedCount]);

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Recent Uploads</h2>
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3" aria-hidden="true">
              <div className="h-11 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2"><div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-2 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" /></div>
            </div>
          ))
        ) : error ? (
          <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-zinc-500">Completed uploads will appear here.</p>
        ) : (
          assets.map((asset) => {
            const label = assetLabel(asset);
            return (
              <Link key={asset.id} href={`/media-workspace/assets/${asset.id}`} className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <MediaThumb url={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-11 w-14 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-100">{label}</span>
                  <span className="block text-[11px] text-zinc-500">{asset.kind?.toUpperCase() ?? "FILE"}{asset.created_at ? ` · ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(asset.created_at))}` : ""}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>
      <Link href="/media-workspace/assets" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        View all media <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
