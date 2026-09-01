"use client";

import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { CompositionLibraryPreviewZone } from "../types";

export function CompositionLibraryPreview({ zones }: { zones?: CompositionLibraryPreviewZone[] }) {
  const assetIds = zones?.flatMap((zone) => zone.firstAssetId ? [zone.firstAssetId] : []) ?? [];
  const previews = usePreviewUrls(assetIds);
  return <div className="relative h-10 w-16 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">{zones?.map((zone) => {
    const url = zone.firstAssetId ? previews.thumbnailUrls[zone.firstAssetId] ?? previews.urls[zone.firstAssetId] : undefined;
    return <div key={zone.position} className="absolute overflow-hidden border border-white/70 bg-zinc-200 dark:bg-zinc-700" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}>{url && <img src={url} alt="" className="h-full w-full object-cover" />}</div>;
  })}</div>;
}
