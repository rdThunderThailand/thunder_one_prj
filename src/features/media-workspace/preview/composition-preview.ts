import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import { fetchPlaylist } from "@/features/media-workspace/playlists";
import type { PlaylistItem } from "@/types/domain";
import type { PlaybackPreviewZone } from "./preview-clock";

export type CompositionPreview = {
  zones: PlaybackPreviewZone[];
  aspectRatio: string;
  referenceResolution: string | null;
};

/** Loads a Composition's Layout plus each Zone Playlist. A Layout alone has geometry but no items. */
export async function loadCompositionPreview(compositionId: string): Promise<CompositionPreview> {
  const composition = await fetchComposition(compositionId);
  const layout = await fetchLayout(composition.layout_id);
  const playlists = await Promise.all(
    composition.zones.map(async (zone) => {
      if (!zone.playlist_id) return [zone.layout_zone_id, []] as const;
      const playlist = await fetchPlaylist(zone.playlist_id);
      return [zone.layout_zone_id, playlist.items] as const;
    }),
  );
  const itemsByZoneId = Object.fromEntries(playlists);

  return {
    aspectRatio: layout.aspect_ratio,
    referenceResolution: layout.reference_resolution ?? null,
    zones: composition.zones.map((zone) => ({
      id: zone.layout_zone_id,
      name: zone.name,
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height,
      playback: zone.playback ? {
        playMode: zone.playback.play_mode,
        repeat: zone.playback.repeat,
        startFrom: zone.playback.start_from,
      } : undefined,
      items: (itemsByZoneId[zone.layout_zone_id] ?? []).map((item: PlaylistItem) => ({
        mediaAssetId: item.media_asset_id,
        label: item.title,
        durationSeconds: item.duration_seconds,
        transition: item.transition,
      })),
    })),
  };
}
