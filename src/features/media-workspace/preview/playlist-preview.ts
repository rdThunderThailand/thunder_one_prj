import type { StagePreview } from "./composition-preview";
import type { GeometryOption } from "./preview-geometry";

/** ADR 0061 §1: a Playlist previews as one full-frame Zone, not a second payload type. The
 *  adapter is a pure function every entry point reaches identically, lifted from the mapping
 *  `ReviewStep.tsx` performed inline. */

export type PlaylistPreviewItem = {
  mediaAssetId: string;
  title?: string | null;
  durationSeconds?: number | null;
  transition?: string | null;
  /** Per-item override — undefined inherits the Playlist default (ADR 0062 §5). */
  transitionDurationSeconds?: number | null;
  mediaFit?: string | null;
};

/** Playlist-level playback, `metadata.playback` in the editor. `transitionDuration` is counted in
 *  seconds throughout the frontend; it gains the unit in its name at the preview boundary (§2). */
export type PlaylistPreviewPlayback = {
  playMode?: "sequential" | "shuffle";
  repeat?: "loop" | "once";
  startFrom?: "first" | "resume";
  defaultTransition?: string | null;
  transitionDuration?: number | null;
  mediaFit?: string | null;
};

/** ADR 0062 §7: the editor's working-list shape (camelCase) → the canonical preview item. Every
 *  `DraftItem` projection becomes a call to this, so no caller hand-rebuilds the item and drops
 *  `mediaFit`/`transitionDurationSeconds` on the way. */
export function draftItemToPreview(item: {
  mediaAssetId: string;
  title?: string;
  durationSeconds: number | null;
  transition?: string | null;
  transitionDurationSeconds?: number | null;
  fit?: string | null;
}): PlaylistPreviewItem {
  return {
    mediaAssetId: item.mediaAssetId,
    title: item.title ?? null,
    durationSeconds: item.durationSeconds,
    transition: item.transition ?? null,
    transitionDurationSeconds: item.transitionDurationSeconds ?? null,
    mediaFit: item.fit ?? null,
  };
}

/** ADR 0062 §7: the backend read shape (snake_case) → the canonical preview item. */
export function playlistItemToPreview(item: {
  media_asset_id: string;
  title?: string;
  duration_seconds?: number | null;
  transition?: string | null;
  transition_duration_seconds?: number | null;
  fit?: string | null;
}): PlaylistPreviewItem {
  return {
    mediaAssetId: item.media_asset_id,
    title: item.title ?? null,
    durationSeconds: item.duration_seconds ?? null,
    transition: item.transition ?? null,
    transitionDurationSeconds: item.transition_duration_seconds ?? null,
    mediaFit: item.fit ?? null,
  };
}

/** ADR 0061 §5: a Playlist has no geometry, so the operator picks the frame. Representative
 *  resolutions state a ratio only — `allowActualSize={false}` keeps them off the pixel control.
 *  16:9 is first so `defaultGeometry` selects it when the counts tie. */
export const playlistGeometryOptions: GeometryOption[] = [
  { id: "1920x1080", label: "16:9 · Landscape", resolution: "1920x1080", count: 1 },
  { id: "1080x1920", label: "9:16 · Portrait", resolution: "1080x1920", count: 1 },
  { id: "1440x1080", label: "4:3 · Standard", resolution: "1440x1080", count: 1 },
];

export function playlistPreviewStage({
  name,
  items,
  playback,
}: {
  name: string;
  items: PlaylistPreviewItem[];
  playback?: PlaylistPreviewPlayback;
}): StagePreview {
  return {
    aspectRatio: "16:9",
    referenceResolution: null,
    zones: [
      {
        id: "playlist-preview",
        name: name || "Playlist",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        playback: playback
          ? {
              playMode: playback.playMode,
              repeat: playback.repeat,
              startFrom: playback.startFrom,
              defaultTransition: playback.defaultTransition ?? null,
              transitionDurationSeconds: playback.transitionDuration ?? null,
              mediaFit: playback.mediaFit ?? null,
            }
          : undefined,
        items: items.map((item) => ({
          mediaAssetId: item.mediaAssetId,
          label: item.title ?? undefined,
          durationSeconds: item.durationSeconds ?? null,
          transition: item.transition ?? null,
          transitionDurationSeconds: item.transitionDurationSeconds ?? null,
          mediaFit: item.mediaFit ?? null,
        })),
      },
    ],
  };
}
