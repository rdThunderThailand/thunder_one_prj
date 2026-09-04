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
};

/** Playlist-level playback, `metadata.playback` in the editor. `transitionDuration` is counted in
 *  seconds throughout the frontend; it gains the unit in its name at the preview boundary (§2). */
export type PlaylistPreviewPlayback = {
  playMode?: "sequential" | "shuffle";
  repeat?: "loop" | "once";
  startFrom?: "first" | "resume";
  defaultTransition?: string | null;
  transitionDuration?: number | null;
};

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
            }
          : undefined,
        items: items.map((item) => ({
          mediaAssetId: item.mediaAssetId,
          label: item.title ?? undefined,
          durationSeconds: item.durationSeconds ?? null,
          transition: item.transition ?? null,
        })),
      },
    ],
  };
}
