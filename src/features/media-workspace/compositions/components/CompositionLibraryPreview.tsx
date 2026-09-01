"use client";

import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { ImageIcon } from "@/components/ui/icons";
import type { CompositionLibraryPreviewZone } from "../types";

export function CompositionLibraryPreview({ zones }: { zones?: CompositionLibraryPreviewZone[] }) {
  const assetIds = zones?.flatMap((zone) => zone.firstAssetId ? [zone.firstAssetId] : []) ?? [];
  const previews = usePreviewUrls(assetIds);
  return <div className="relative flex h-10 w-16 items-center justify-center overflow-hidden rounded bg-zinc-100 text-zinc-400 dark:bg-zinc-800"><ImageIcon />{zones?.map((zone) => {
    const url = zone.firstAssetId ? previews.thumbnailUrls[zone.firstAssetId] ?? previews.urls[zone.firstAssetId] : undefined;
    const isVideo = url ? /\.(mp4|mov|webm)(?:\?|$)/i.test(url) : false;
    return <div key={zone.position} className="absolute overflow-hidden border border-white/70 bg-zinc-200/70 dark:bg-zinc-700/70" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}>{url && (isVideo
      ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      : <img src={url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} className="h-full w-full object-cover" />)}</div>;
  })}</div>;
}
