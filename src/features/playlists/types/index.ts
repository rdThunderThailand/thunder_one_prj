// Read shapes (Transition, PlaylistStatus, Creator, PlaylistItem, PlaylistListItem,
// PlaylistDetail) live in src/types/domain.ts — see docs/adr/0020 — so
// src/lib/api/media-api.ts can host fetchPlaylist/fetchPlaylists without importing
// from this feature. Re-exported here so existing imports keep working.
import { TRANSITIONS, PLAYLIST_STATUSES } from "@/types/domain";
import type {
  Transition,
  PlaylistStatus,
  Creator,
  PlaylistItem,
  PlaylistListItem,
  PlaylistDetail,
} from "@/types/domain";

export { TRANSITIONS, PLAYLIST_STATUSES };
export type { Transition, PlaylistStatus, Creator, PlaylistItem, PlaylistListItem, PlaylistDetail };

export const PLAYLIST_TYPES = ["standard", "dynamic", "loop", "manual"] as const;
export type PlaylistType = (typeof PLAYLIST_TYPES)[number];

export const PLAY_MODES = ["sequential", "shuffle"] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export const REPEAT_MODES = ["loop", "once"] as const;
export type RepeatMode = (typeof REPEAT_MODES)[number];

export const MEDIA_FITS = ["fit", "fill", "stretch"] as const;
export type MediaFit = (typeof MEDIA_FITS)[number];

export const FAILURE_HANDLINGS = ["skip", "stop"] as const;
export type FailureHandling = (typeof FAILURE_HANDLINGS)[number];

/** Descriptive fields with no column of their own. Stored under `metadata.info`. */
export type PlaylistInfo = {
  description?: string;
  campaignId?: string;
  tags?: string[];
  playlistType?: PlaylistType;
  resolution?: string;
  frameRate?: number;
  /** Set only when the operator explicitly picks a cover. Absent means "use item 1"
   *  — resolved at read time so reordering never needs a write-back. */
  coverAssetId?: string;
};

/**
 * Playback preferences, stored under `metadata.playback`.
 *
 * ponytail: only `defaultImageDuration` and `defaultTransition` reach a screen, and only
 * because the wizard bakes them into each `playlist_items` row. `media_job_poll` reads
 * nothing else off a playlist — see docs/adr/0010-playlist-settings-in-metadata.md.
 */
export type PlaylistPlayback = {
  playMode?: PlayMode;
  repeat?: RepeatMode;
  startFrom?: "first";
  defaultImageDuration?: number;
  mediaFit?: MediaFit;
  audioEnabled?: boolean;
  defaultVolume?: number;
  defaultTransition?: Transition;
  transitionDuration?: number;
  failureHandling?: FailureHandling;
  warnOnSkip?: boolean;
};

export type PlaylistMetadata = {
  info: PlaylistInfo;
  playback: PlaylistPlayback;
};

/** One row in the wizard's working list, before it becomes a `playlist_items` row. */
export type DraftItem = {
  mediaAssetId: string;
  title?: string;
  kind?: "video" | "image";
  /** Null lets the backend fall back to the asset's own duration (videos). */
  durationSeconds: number | null;
  transition: Transition;
};
