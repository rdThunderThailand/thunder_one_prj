// Read shapes (Transition, PlaylistStatus, Creator, PlaylistItem, PlaylistListItem,
// PlaylistDetail) live in src/types/domain.ts — see docs/adr/0020 — so
// src/lib/api/media-api.ts can host fetchPlaylist/fetchPlaylists without importing
// from this feature. Re-exported here so existing imports keep working.
// Relative (not "@/…") so this barrel's values stay importable from a plain `node
// *.check.mts` run, which has no path-alias resolution — same file either way.
import { TRANSITIONS, PLAYLIST_STATUSES } from "../../../../types/domain.ts";
import type {
  Transition,
  PlaylistStatus,
  Creator,
  PlaylistItem,
  PlaylistListItem,
  PlaylistDetail,
} from "../../../../types/domain.ts";

export { TRANSITIONS, PLAYLIST_STATUSES };
export type { Transition, PlaylistStatus, Creator, PlaylistItem, PlaylistListItem, PlaylistDetail };

/** Every type the system knows. `loop` and `manual` were dropped — nothing ever produced one
 *  and no prod row holds either (ADR 0032). */
export const PLAYLIST_TYPES = ["standard", "dynamic"] as const;
export type PlaylistType = (typeof PLAYLIST_TYPES)[number];

/** What the Create wizard may actually emit. `dynamic` is reserved, not producible this phase,
 *  so offering it would be a dead dropdown option. */
export const CREATABLE_PLAYLIST_TYPES = ["standard"] as const;

export const PLAY_MODES = ["sequential", "shuffle"] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export const REPEAT_MODES = ["loop", "once"] as const;
export type RepeatMode = (typeof REPEAT_MODES)[number];

export const START_FROMS = ["first", "resume"] as const;
export type StartFrom = (typeof START_FROMS)[number];

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
  /** Canonical selector value, e.g. "1920x1080". `width`/`height` are derived from it at encode
   *  time so the stored profile carries real numbers (ADR 0032). */
  resolution?: string;
  width?: number;
  height?: number;
  frameRate?: number;
  /** Set only when the operator explicitly picks a cover. Absent means "use item 1"
   *  — resolved at read time so reordering never needs a write-back. */
  coverAssetId?: string;
};

/**
 * Playback preferences, stored under `metadata.playback`.
 *
 * play_mode/repeat/start_from are now emitted on every media_job_poll slot under `playback`;
 * see docs/adr/0031-playback-behavior-reaches-the-player.md.
 */
export type PlaylistPlayback = {
  playMode?: PlayMode;
  repeat?: RepeatMode;
  startFrom?: StartFrom;
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
  /** Per-item overrides — #37 (ADR 0060 §5a). Undefined means inherit the playlist default. */
  transitionDurationSeconds?: number;
  fit?: MediaFit;
  backgroundColor?: string;
  notes?: string;
};
