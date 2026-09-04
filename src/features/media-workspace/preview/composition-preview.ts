import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import type { PlaylistItem } from "@/types/domain";
import type { PlaybackPreviewZone } from "./preview-clock";
import { playlistItemToPreview, type PlaylistPreviewPlayback } from "./playlist-preview";

/** One preview payload shape for all three sources (ADR 0061 §1). A Playlist reduces to a single
 *  full-frame Zone rather than a second payload type. */
export type StagePreview = {
  zones: PlaybackPreviewZone[];
  aspectRatio: string;
  referenceResolution: string | null;
};

/** ADR 0062 §7: one shared mapper for both Composition preview sites. A Zone binding carries
 *  `play_mode`/`repeat`/`start_from` only — those three win when the binding sets them (a
 *  Composition overrides the Playlist deliberately); `defaultTransition`, `transitionDuration` and
 *  `mediaFit` always come from the bound Playlist, since the binding never carries them. */
export function compositionZonePreview(
  zone: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    playback?: { playMode?: "sequential" | "shuffle"; repeat?: "loop" | "once"; startFrom?: "first" | "resume" } | null;
  },
  items: Parameters<typeof playlistItemToPreview>[0][],
  playlistPlayback?: PlaylistPreviewPlayback,
): PlaybackPreviewZone {
  return {
    id: zone.id,
    name: zone.name,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    playback: {
      playMode: zone.playback?.playMode ?? playlistPlayback?.playMode,
      repeat: zone.playback?.repeat ?? playlistPlayback?.repeat,
      startFrom: zone.playback?.startFrom ?? playlistPlayback?.startFrom,
      defaultTransition: playlistPlayback?.defaultTransition ?? null,
      transitionDurationSeconds: playlistPlayback?.transitionDuration ?? null,
      mediaFit: playlistPlayback?.mediaFit ?? null,
    },
    items: items.map(playlistItemToPreview),
  };
}

/** Loads a Composition's Layout plus each Zone Playlist. A Layout alone has geometry but no items. */
export async function loadCompositionPreview(compositionId: string): Promise<StagePreview> {
  const composition = await fetchComposition(compositionId);
  const layout = await fetchLayout(composition.layout_id);
  const playlists = await Promise.all(
    composition.zones.map(async (zone) => {
      if (!zone.playlist_id) return [zone.layout_zone_id, { items: [] as PlaylistItem[], playback: undefined as PlaylistPreviewPlayback | undefined }] as const;
      const playlist = await fetchPlaylist(zone.playlist_id);
      return [zone.layout_zone_id, { items: playlist.items, playback: decodeMetadata(playlist.metadata).playback }] as const;
    }),
  );
  const byZoneId = Object.fromEntries(playlists);

  return {
    aspectRatio: layout.aspect_ratio,
    referenceResolution: layout.reference_resolution ?? null,
    zones: composition.zones.map((zone) =>
      compositionZonePreview(
        {
          id: zone.layout_zone_id,
          name: zone.name,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height,
          playback: zone.playback
            ? { playMode: zone.playback.play_mode, repeat: zone.playback.repeat, startFrom: zone.playback.start_from }
            : null,
        },
        byZoneId[zone.layout_zone_id]?.items ?? [],
        byZoneId[zone.layout_zone_id]?.playback,
      ),
    ),
  };
}
