/** The only transitions a screen understands — `playlist_items.transition` is
 *  `CHECK (transition IN ('cut','fade'))`. Slide/Wipe from the mockup do not exist. */
export const TRANSITIONS = ["cut", "fade"] as const;
export type Transition = (typeof TRANSITIONS)[number];

export const PLAYLIST_STATUSES = ["draft", "active", "inactive"] as const;
export type PlaylistStatus = (typeof PLAYLIST_STATUSES)[number];

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

/** `{id, display_name}` or null — same shape publications uses (migrations 077/079). */
export type Creator = { id: string; display_name: string } | null;

export type PlaylistItem = {
  media_asset_id: string;
  title?: string;
  position: number;
  duration_seconds?: number | null;
  transition?: Transition;
};

export type PlaylistListItem = {
  id: string;
  name: string;
  status: PlaylistStatus;
  item_count: number;
  created_at?: string;
  /** Phase 2 fields — absent until the list RPC is extended. */
  metadata?: Record<string, unknown>;
  cover_asset_id?: string | null;
  created_by?: Creator;
};

export type PlaylistDetail = {
  id: string;
  name: string;
  status: PlaylistStatus;
  items: PlaylistItem[];
  revision: number;
  /** Phase 2 fields — absent until the get RPC is extended. */
  metadata?: Record<string, unknown>;
  created_by?: Creator;
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
