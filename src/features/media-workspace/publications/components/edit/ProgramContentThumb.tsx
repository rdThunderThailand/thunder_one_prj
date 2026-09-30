"use client";

import { useEffect, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { decodeMetadata, fetchPlaylist, resolveCoverAssetId } from "@/features/media-workspace/playlists";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import type { ProgramContent } from "../../program-edit";
import { ProgramPreviewButton } from "./ProgramPreviewButton";

type Zone = { id: string; name: string; x: number; y: number; width: number; height: number };

type Thumb =
  | { kind: "asset"; assetId: string | undefined }
  | { kind: "layout"; zones: Zone[]; aspectRatio: string; resolution: string | null };

/** What the thumbnail depends on — a Program rename or tag edit must not refetch it. */
type Source = { compositionId: string | null; playlistId: string | null; firstAssetId: string | undefined };

async function loadThumb(source: Source): Promise<Thumb> {
  if (source.compositionId) {
    const composition = await fetchComposition(source.compositionId);
    const layout = await fetchLayout(composition.layout_id);
    return {
      kind: "layout",
      zones: composition.zones.map((z) => ({ id: z.layout_zone_id, name: z.name, x: z.x, y: z.y, width: z.width, height: z.height })),
      aspectRatio: layout.aspect_ratio,
      resolution: layout.reference_resolution ?? null,
    };
  }
  if (source.playlistId) {
    const playlist = await fetchPlaylist(source.playlistId);
    return { kind: "asset", assetId: resolveCoverAssetId(decodeMetadata(playlist.metadata).info.coverAssetId, playlist.items) };
  }
  return { kind: "asset", assetId: source.firstAssetId };
}

/** Frame 03's picture beside Program Details: the Playlist cover, or a Layout's zone plan (Layouts have no cover). */
export function ProgramContentThumb({ content }: { content: ProgramContent }) {
  const compositionId = content.type === "composition" ? content.compositionId : null;
  const playlistId = content.type === "composition" ? null : content.playlistId;
  const firstAssetId = content.items[0]?.media_asset_id;
  const key = compositionId ?? playlistId ?? firstAssetId ?? "";
  const [loaded, setLoaded] = useState<{ key: string; thumb: Thumb | null } | null>(null);
  const thumb = loaded?.key === key ? loaded.thumb : null;
  const assetId = thumb?.kind === "asset" ? thumb.assetId : undefined;
  const previews = usePreviewUrls(assetId ? [assetId] : []);

  useEffect(() => {
    let cancelled = false;
    loadThumb({ compositionId, playlistId, firstAssetId })
      .catch(() => null)
      .then((next) => !cancelled && setLoaded({ key, thumb: next }));
    return () => {
      cancelled = true;
    };
  }, [key, compositionId, playlistId, firstAssetId]);

  const ratio = thumb?.kind === "layout" ? thumb.aspectRatio.replace(":", " / ") : "16 / 9";

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        style={{ aspectRatio: ratio }}
      >
        {thumb?.kind === "layout" &&
          thumb.zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute flex items-center justify-center border border-primary/40 bg-primary/10 p-1 text-center text-xs text-primary"
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
            >
              <span className="truncate">{zone.name}</span>
            </div>
          ))}
        {thumb?.kind === "asset" && assetId && (
          <MediaThumb
            url={previews.urls[assetId]}
            thumbnailUrl={previews.thumbnailUrls[assetId]}
            alt={content.name ?? "Program content"}
            className="h-full w-full rounded-none"
          />
        )}
        {thumb?.kind === "layout" && thumb.resolution && (
          <span className="absolute left-2 top-2 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-background">
            {thumb.resolution}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{content.name ?? "—"}</p>
        <ProgramPreviewButton
          key={key}
          content={content}
          label="Open Preview"
          size="sm"
        />
      </div>
    </div>
  );
}
