"use client";

import { useEffect, useState } from "react";
import { fetchPlaylists } from "@/lib/api/media-api";
import { decodeMetadata, fetchPlaylist, resolveCoverAssetId } from "@/features/media-workspace/playlists";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import type { ProgramContent } from "../../program-edit";

export type SummaryZone = { id: string; name: string; x: number; y: number; width: number; height: number };
type Tag = { id: string; name: string };

/** What frame 03 shows about the bound content, beside Program Details and in the Content Source card. */
export type ContentSummary =
  | { kind: "asset"; assetId: string | undefined; itemCount: number | null; durationSeconds: number | null; tags: Tag[] }
  | { kind: "layout"; zones: SummaryZone[]; aspectRatio: string; resolution: string | null; tags: Tag[] };

type Source = { compositionId: string | null; playlistId: string | null; firstAssetId: string | undefined };

async function load(source: Source): Promise<ContentSummary> {
  if (source.compositionId) {
    const composition = await fetchComposition(source.compositionId);
    const layout = await fetchLayout(composition.layout_id);
    return {
      kind: "layout",
      zones: composition.zones.map((z) => ({ id: z.layout_zone_id, name: z.name, x: z.x, y: z.y, width: z.width, height: z.height })),
      aspectRatio: layout.aspect_ratio,
      resolution: layout.reference_resolution ?? null,
      tags: composition.tags ?? [],
    };
  }
  if (source.playlistId) {
    // The Playlist detail has no tags or totals; the list row carries them (same as the Playlists page).
    const row = (await fetchPlaylists(true)).find((p) => p.id === source.playlistId);
    if (row) {
      return {
        kind: "asset",
        assetId: row.cover_asset_id ?? decodeMetadata(row.metadata).info.coverAssetId,
        itemCount: row.item_count,
        durationSeconds: row.total_duration_seconds ?? null,
        tags: row.tags ?? [],
      };
    }
    const playlist = await fetchPlaylist(source.playlistId);
    return {
      kind: "asset",
      assetId: resolveCoverAssetId(decodeMetadata(playlist.metadata).info.coverAssetId, playlist.items),
      itemCount: playlist.items.length,
      durationSeconds: null,
      tags: [],
    };
  }
  return { kind: "asset", assetId: source.firstAssetId, itemCount: null, durationSeconds: null, tags: [] };
}

// ponytail: page-lifetime cache so the thumbnail and the Content Source card share one fetch per content;
// a Playlist edited in another tab shows stale tags until reload — key by revision if that matters.
const cache = new Map<string, Promise<ContentSummary | null>>();

export function useContentSummary(content: ProgramContent): { key: string; summary: ContentSummary | null } {
  const compositionId = content.type === "composition" ? content.compositionId : null;
  const playlistId = content.type === "composition" ? null : content.playlistId;
  const firstAssetId = content.items[0]?.media_asset_id;
  const key = compositionId ?? playlistId ?? firstAssetId ?? "";
  const [loaded, setLoaded] = useState<{ key: string; summary: ContentSummary | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!cache.has(key)) cache.set(key, load({ compositionId, playlistId, firstAssetId }).catch(() => null));
    cache.get(key)!.then((summary) => !cancelled && setLoaded({ key, summary }));
    return () => {
      cancelled = true;
    };
  }, [key, compositionId, playlistId, firstAssetId]);

  return { key, summary: loaded?.key === key ? loaded.summary : null };
}
