"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { NoAccess } from "@/components/ui/NoAccess";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchMediaAssets } from "@/lib/api/media-api";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { isVideoUrl } from "@/lib/media-kind";
import type { MediaAsset } from "@/types/domain";
import { fetchPlaylist } from "../services/playlists-api";
import { decodeMetadata, resolveCoverAssetId } from "../metadata";
import { formatDuration, totalDurationSeconds } from "../duration";
import { computePlaylistTotals } from "../totals";
import type { PlaylistDetail } from "../types";
import { PlaylistItemsTable } from "./PlaylistItemsTable";
import { PlaylistProperties } from "./PlaylistProperties";

export function PlaylistDetailPage({ playlistId }: { playlistId: string }) {
  // Keyed by playlist id so a stale response for the previous id, arriving after
  // playlistId already changed, never renders under the wrong header.
  const [result, setResult] = useState<
    | { id: string; detail: PlaylistDetail }
    | { id: string; error: ClassifiedError }
    | null
  >(null);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlaylist(playlistId)
      .then((detail) => alive && setResult({ id: playlistId, detail }))
      .catch(
        (err) =>
          alive &&
          setResult({ id: playlistId, error: classifyApiError(err, "โหลดรายละเอียดไม่สำเร็จ") })
      );
    return () => {
      alive = false;
    };
  }, [playlistId]);

  useEffect(() => {
    // Progressive load: the item table and properties don't wait on this — they
    // render from `detail` alone. This only fills in joined columns (name,
    // resolution, size) and degrades those to "—" if it fails.
    let alive = true;
    fetchMediaAssets()
      .then((data) => alive && setAssets(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const current = result?.id === playlistId ? result : null;
  const detail = current && "detail" in current ? current.detail : null;
  const error = current && "error" in current ? current.error : null;

  const items = useMemo(
    () => (detail ? [...detail.items].sort((a, b) => a.position - b.position) : []),
    [detail]
  );
  // Derived, not reset in an effect: an id from the previous playlist simply
  // won't match any item here, so switching playlists clears the selection for free.
  const selectedItem = items.find((i) => i.media_asset_id === selectedAssetId) ?? null;

  const assetsById = useMemo(() => {
    const map: Record<string, MediaAsset> = {};
    (assets ?? []).forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [assets]);

  const metadata = decodeMetadata(detail?.metadata);
  const coverId = resolveCoverAssetId(metadata.info.coverAssetId, items);

  const previewIds = useMemo(() => {
    const ids = new Set(items.map((i) => i.media_asset_id));
    if (coverId) ids.add(coverId);
    return [...ids];
  }, [items, coverId]);
  const previews = usePreviewUrls(previewIds);

  const previewAssetId = selectedItem?.media_asset_id ?? coverId;
  const previewUrl = previewAssetId ? previews.urls[previewAssetId] : undefined;
  const previewThumbnailUrl = previewAssetId ? previews.thumbnailUrls[previewAssetId] : undefined;
  const previewAsset = previewAssetId ? assetsById[previewAssetId] : undefined;
  const isPlayingVideo =
    !!selectedItem &&
    !!previewUrl &&
    (previewAsset?.kind === "video" || (!previewAsset && isVideoUrl(previewUrl)));

  const totalDuration = formatDuration(
    totalDurationSeconds(
      items.map((i) => ({ mediaAssetId: i.media_asset_id, durationSeconds: i.duration_seconds ?? null })),
      Object.fromEntries(items.map((i) => [i.media_asset_id, assetsById[i.media_asset_id]?.duration_seconds]))
    )
  );
  const totals = computePlaylistTotals(items, assetsById);

  if (error?.kind === "forbidden") {
    return <NoAccess message={error.message} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p
          className={`text-sm ${
            error.kind === "not-found" ? "text-zinc-500 dark:text-zinc-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {error.message}
        </p>
        <Link href="/media-workspace/playlists" className={buttonClasses("secondary")}>
          กลับไปยังรายการ
        </Link>
      </div>
    );
  }

  if (!detail) {
    return <p className="py-16 text-center text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={detail.name}
        subtitle={`${items.length} items · ${totalDuration}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/media-workspace/playlists" className={buttonClasses("secondary")}>
              กลับ
            </Link>
            <Link href={`/media-workspace/playlists/create?id=${detail.id}`} className={buttonClasses("secondary")}>
              Edit Playlist
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
              {isPlayingVideo ? (
                <video key={previewUrl} src={previewUrl} controls className="h-full w-full object-contain" />
              ) : (
                <MediaThumb
                  url={previewUrl}
                  thumbnailUrl={previewThumbnailUrl}
                  kind={previewAsset?.kind}
                  mimeType={previewAsset?.file?.mime_type}
                  alt={detail.name}
                  className="h-full w-full rounded-none"
                />
              )}
            </div>
          </Card>

          <PlaylistProperties
            detail={detail}
            metadata={metadata}
            itemCount={items.length}
            totalDuration={totalDuration}
          />
        </div>

        <div className="lg:col-span-3">
          <PlaylistItemsTable
            items={items}
            assetsById={assetsById}
            previews={previews}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedAssetId(item.media_asset_id)}
            totals={totals}
          />
        </div>
      </div>
    </div>
  );
}
