// Shared domain entity types, used by 2+ features. Mirrors the glossary in
// CONTEXT.md at the repo root — keep both in sync when either changes.

export type MediaDeviceHealth = "online" | "warning" | "offline";

// Publication's own lifecycle status — separate from Publish Job delivery
// status. See CONTEXT.md: "Publication".
export type PublicationLifecycleStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled";

// Per-target delivery status — one row per Publish Job x Device. See
// CONTEXT.md: "Publish Job". Mirrors media_core.publish_job_targets.status
// (Thunder_Core migration 091 added "delivered").
export type PublishJobStatus =
  | "pending"
  | "downloading"
  | "delivered"
  | "playing"
  | "failed";

// Campaign, Tag and Asset are read by both publications and playlists — the API shapes
// live here so neither feature has to import from the other.

export type Campaign = {
  id: string;
  name: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  brand_id?: string;
  brand_name?: string;
};

export type Tag = {
  id: string;
  name: string;
  usage_count?: number;
};

export type MediaAsset = {
  id: string;
  title?: string;
  status?: string;
  kind?: "video" | "image";
  approval_status?: string;
  language?: string;
  duration_seconds?: number | null;
  width?: number;
  height?: number;
  codec?: string;
  folder_id?: string | null;
  thumbnail_storage_key?: string | null;
  created_at?: string;
  file?: {
    id?: string;
    original_filename?: string;
    mime_type?: string;
    file_size_bytes?: number;
    checksum?: string;
  };
};

export type ContentFolder = {
  id: string;
  parent_id: string | null;
  name: string;
  created_at?: string;
};

export type MediaAssetPage = {
  items: MediaAsset[];
  total: number;
  page: number;
  page_size: number;
  stats: { total: number; images: number; videos: number };
};

// Playlist read shapes — moved here from features/playlists so
// src/lib/api/media-api.ts (which never imports from a feature) can host the
// read calls (`fetchPlaylist`, `fetchPlaylists`) both publications and
// playlists use. features/playlists/types re-exports these; write-side
// concerns (metadata sub-shapes, draft shapes) stay feature-local.

/** The only transitions a screen understands — `playlist_items.transition` is
 *  `CHECK (transition IN ('cut','fade'))`. Slide/Wipe from the mockup do not exist. */
export const TRANSITIONS = ["cut", "fade"] as const;
export type Transition = (typeof TRANSITIONS)[number];

export const PLAYLIST_STATUSES = ["draft", "active", "inactive"] as const;
export type PlaylistStatus = (typeof PLAYLIST_STATUSES)[number];

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
  metadata?: Record<string, unknown>;
  cover_asset_id?: string | null;
  created_by?: Creator;
  /** Added by Thunder_Core migration 097 — optional so a frontend deploy that lands
   *  ahead of the backend renders "—" instead of crashing. */
  updated_at?: string;
  total_duration_seconds?: number;
  /** Publications pointing at this playlist, any status — Thunder_Core migration 098.
   *  Optional for the same deploy-ordering reason as the fields above; when it is
   *  missing the display status falls back to the stored `status`. */
  publication_count?: number;
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
  /** Publications pointing at this playlist, any status — Thunder_Core migration 098. */
  publication_count?: number;
};
