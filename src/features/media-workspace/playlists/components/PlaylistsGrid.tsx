"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/lovable/badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { decodeMetadata } from "../metadata";
import { formatDuration } from "../duration";
import { playlistContentType } from "../list-filtering";
import { playlistDisplayStatus, statusBadge } from "../status-display";
import type { PlaylistListItem } from "../types";

const typeLabel = { video: "Video", image: "Image", mixed: "Mixed" } as const;
const statusVariant = (color: string) => color === "green" ? "success" : color === "yellow" ? "warning" : "neutral";

export function PlaylistsGrid({ rows }: { rows: PlaylistListItem[] }) {
  const coverIds = useMemo(() => rows.map((row) => row.cover_asset_id ?? decodeMetadata(row.metadata).info.coverAssetId).filter((id): id is string => !!id), [rows]);
  const previews = usePreviewUrls([...new Set(coverIds)]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {rows.map((playlist) => {
        const cover = playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;
        const type = playlistContentType(playlist);
        const status = statusBadge(playlistDisplayStatus(playlist));
        return (
          <Link key={playlist.id} href={`/media-workspace/playlists/${playlist.id}`} className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-foreground/20 hover:shadow-float">
            <MediaThumb url={cover ? previews.urls[cover] : undefined} thumbnailUrl={cover ? previews.thumbnailUrls[cover] : undefined} alt={playlist.name} className="aspect-video w-full rounded-none" />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{playlist.name}</h3>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{decodeMetadata(playlist.metadata).info.description || "No description"}</p>
                </div>
                <Badge variant={statusVariant(status.color)} className="shrink-0 rounded-full px-2 py-0 text-[9px]">{status.label}</Badge>
              </div>
              <p className="mt-3 text-[9px] text-muted-foreground">
                {type ? typeLabel[type] : "—"} · {playlist.total_duration_seconds == null ? "—" : formatDuration(playlist.total_duration_seconds)} · {playlist.item_count.toLocaleString()} items
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
