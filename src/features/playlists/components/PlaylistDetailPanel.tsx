"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { XIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPlaylist } from "../services/playlists-api";
import { decodeMetadata, resolveCoverAssetId } from "../metadata";
import { formatDuration, totalDurationSeconds } from "../duration";
import { statusBadge } from "../status-display";
import type { PlaylistDetail, PlaylistListItem } from "../types";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";

export function PlaylistDetailPanel({
  playlist,
  onClose,
  onStatusChange,
}: {
  playlist: PlaylistListItem;
  onClose: () => void;
  onStatusChange: (id: string, status: "active" | "inactive") => void;
}) {
  // Keyed by playlist id so a stale response, or the previous playlist's detail, never
  // renders under the wrong header — no separate "clear on id change" reset needed.
  const [result, setResult] = useState<
    { id: string; detail: PlaylistDetail } | { id: string; error: ClassifiedError } | null
  >(null);

  useEffect(() => {
    let alive = true;
    fetchPlaylist(playlist.id)
      .then((d) => alive && setResult({ id: playlist.id, detail: d }))
      .catch(
        (err) =>
          alive &&
          setResult({ id: playlist.id, error: classifyApiError(err, "โหลดรายละเอียดไม่สำเร็จ") })
      );
    return () => {
      alive = false;
    };
  }, [playlist.id]);

  const current = result?.id === playlist.id ? result : null;
  const detail = current && "detail" in current ? current.detail : null;
  const error = current && "error" in current ? current.error : null;

  const metadata = decodeMetadata(detail?.metadata ?? playlist.metadata);
  const items = detail?.items ?? [];
  const coverId = resolveCoverAssetId(metadata.info.coverAssetId, items);
  const coverIds = useMemo(() => (coverId ? [coverId] : []), [coverId]);
  const previews = usePreviewUrls(coverIds);

  const createdBy = detail?.created_by ?? playlist.created_by;

  return (
    <div className="w-full max-w-sm shrink-0 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
        <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {playlist.name}
        </h2>
        <button onClick={onClose} aria-label="ปิด" className="text-zinc-400 hover:text-zinc-700">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <MediaThumb
        url={coverId ? previews.urls[coverId] : undefined}
        alt={playlist.name}
        className="h-40 w-full rounded-none"
      />

      <div className="p-4">
        <Badge color={statusBadge(playlist.status).color} variant="pill">
          {statusBadge(playlist.status).label}
        </Badge>

        {error && <p className="mt-3 text-sm text-red-500">{error.message}</p>}

        <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          <Row label="Playlist Type" value={metadata.info.playlistType ?? "—"} />
          <Row label="Items" value={playlist.item_count} />
          <Row
            label="Duration"
            value={
              detail
                ? formatDuration(
                    totalDurationSeconds(
                      items.map((i) => ({
                        mediaAssetId: i.media_asset_id,
                        durationSeconds: i.duration_seconds ?? null,
                      }))
                    )
                  )
                : "—"
            }
          />
          <Row label="Resolution" value={metadata.info.resolution ?? "—"} />
          <Row
            label="Created By"
            value={createdBy?.display_name ?? "—"}
          />
          <Row label="Created At" value={playlist.created_at?.slice(0, 10) ?? "—"} />
        </div>

        {metadata.info.description && (
          <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {metadata.info.description}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            href={`/playlists/create?id=${playlist.id}`}
            className={buttonClasses("primary", "flex-1")}
          >
            Edit Playlist
          </Link>
          {/* A draft has no status toggle on purpose: it would read as "Activate" and publish a
              playlist that never passed validateStep — no items, no playback settings — straight
              to the screens. Finishing it goes through the wizard (docs/adr/0014). */}
          {playlist.status !== "draft" && (
            <Button
              variant="secondary"
              onClick={() =>
                onStatusChange(playlist.id, playlist.status === "active" ? "inactive" : "active")
              }
            >
              {playlist.status === "active" ? "Archive" : "Activate"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
