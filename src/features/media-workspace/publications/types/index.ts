export const PUBLICATION_TYPES = [
  "image",
  "video",
  "playlist",
  "html",
  "dynamic",
  "composition",
] as const;

export type PublicationType = (typeof PUBLICATION_TYPES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

// Shared with playlists — the shapes live in src/types/domain.ts.
export type { Campaign, MediaAsset, Tag, PlaylistItem, PlaylistDetail } from "@/types/domain";
export type { PublishJobStatus } from "@/types/domain";
import type { PublishJobStatus } from "@/types/domain";
import type { PublicationDriftCheck } from "../publication-drift";

export type BasicInfoForm = {
  name: string;
  description?: string;
  campaign_id?: string;
  publication_type?: PublicationType;
  priority?: Priority;
  language?: string;
  tags?: string[];
  playlist_id?: string;
  composition_id?: string;
};

export type Publication = {
  id?: string;
  publication_id?: string;
  name?: string;
  description?: string;
  campaign_id?: string;
  publication_type?: PublicationType;
  priority?: Priority;
  language?: string;
  tags?: string[];
  playlist_id?: string;
  composition_id?: string;
  status?: string;
  revision?: number;
  created_at?: string;
  updated_at?: string;
};

export type PublicationListItem = {
  id: string;
  name: string;
  /** Stored operator intent: draft | active | cancelled (docs/adr/0004). */
  status: string;
  /** Clock-aware lifecycle for display: adds scheduled | ended. Read this to
   * answer "what phase is this in"; read `status` for "was it activated". */
  effective_status?: string;
  publication_type: PublicationType;
  priority: Priority;
  language?: string;
  campaign_id?: string;
  campaign_name?: string;
  playlist_id?: string;
  composition_id?: string;
  composition_name?: string;
  item_count: number;
  tags: string[];
  /** Who created the draft — null for rows created before this field existed. */
  created_by?: { id: string; display_name: string } | null;
  created_at?: string;
  updated_at?: string;
};

/** Per-file ack detail, keyed by media_asset_id. Diagnostic only — see migration 084. */
export type FileStatusEntry = {
  status: "downloading" | "delivered" | "playing" | "failed";
  error?: string | null;
  acked_at: string;
  /** Device-clock evidence from the success-only Publication download report. */
  reported_at?: string | null;
  /** Local cache filename, not the original uploaded filename. */
  file_name?: string | null;
  /** Actual bytes on the device after download/cache reuse. */
  file_size?: number | null;
  /** Echo of the checksum supplied by the player jobs response. */
  checksum?: string | null;
  /** False with a null checksum means verification was unavailable, not failed. */
  verified?: boolean;
  /** True = fetched this attempt; false = an existing cache entry was reused. */
  downloaded?: boolean;
  delivery_attempt?: number;
};

export type PublicationPlaybackWindow = {
  state: "before" | "open" | "between" | "ended";
  opened_at: string | null;
  closes_at: string | null;
  next_opens_at: string | null;
};

/** Per-device delivery status. Populated only after activation. */
export type PublicationDeliveryTarget = {
  device_id: string;
  device_name?: string | null;
  status?: PublishJobStatus | null;
  attempt_count?: number | null;
  error_message?: string | null;
  acked_at?: string | null;
  updated_at?: string | null;
  file_statuses?: Record<string, FileStatusEntry>;
  retry_count?: number | null;
  last_retried_at?: string | null;
  last_heartbeat_at?: string | null;
  status_level?: "online" | "warning" | "offline";
};

export type PublicationDetail = {
  id: string;
  name: string;
  description?: string;
  campaign_id?: string;
  publication_type: PublicationType;
  priority: Priority;
  language?: string;
  metadata?: Record<string, unknown>;
  /** Stored operator intent: draft | active | cancelled (docs/adr/0004). */
  status: string;
  /** Clock-aware lifecycle for display: adds scheduled | ended. */
  effective_status?: string;
  /** Optimistic-lock counter — bumped on every draft write (docs/adr/0003). */
  revision?: number;
  playlist?: { id: string; name: string } | null;
  /** Set only for publication_type = 'composition' (ADR 0049 §5, §12). */
  composition?: { id: string; name: string; status: string } | null;
  /** Recorded-vs-live revisions of the airing snapshot; null for a flat Publication and for
   *  one never activated. Compare with `publicationDrift` (ADR 0049 §11). */
  drift_check?: PublicationDriftCheck | null;
  tags: string[];
  created_at?: string;
  activated_at?: string;
  /** Set only when status is cancelled (migration 067) — the delivery-progress "completed at"
   * for a Cancelled result reads this since no target activity marks a cancellation. */
  cancelled_at?: string | null;
  job_status?: string;
  /** Who pressed publish — null for publications activated before ADR 0005. */
  published_by?: { id: string; display_name: string } | null;
  /** Who created the draft — null for rows created before this field existed. */
  created_by?: { id: string; display_name: string } | null;
  /** Delivery status per device — populated only after activation. */
  targets?: PublicationDeliveryTarget[];
  /** The publication's own targets, saved in step 3. */
  publication_targets?: PublicationTarget[];
  /** The schedule saved in step 4 (null on a draft that hasn't reached it). */
  schedule?: PublicationSchedule | null;
  /** Recurrence-aware current/next playback window, derived by the backend. */
  playback_window?: PublicationPlaybackWindow | null;
};

export type PublicationTarget = {
  target_type: "channel" | "device";
  channel_id?: string | null;
  device_id?: string | null;
  name?: string | null;
};

export type ContentItem = {
  media_asset_id: string;
  position: number;
  duration_seconds?: number | null;
  transition?: string;
};

// --- Step 4: Schedule -------------------------------------------------------

export const SCHEDULE_TYPES = ["now", "later", "recurring", "range"] as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

/** `{}` = one-time. Weekly is the only recurring frequency the backend honours. */
export type Recurrence =
  | Record<string, never>
  | { freq: "weekly"; days: number[]; daily_start: string; daily_end: string };

/** Wizard-local step-4 form. Dates/times are wall-clock in `timezone`. */
export type ScheduleForm = {
  schedule_type: ScheduleType;
  start_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  timezone: string; // IANA, e.g. "Asia/Bangkok"
  end_date: string; // "YYYY-MM-DD" — "" means none
  end_time: string; // "HH:MM"
  days: number[]; // recurring only: 0=Sun .. 6=Sat
  daily_start: string; // recurring only: "HH:MM"
  daily_end: string; // recurring only: "HH:MM"
};

/** Persisted schedule, as returned by set_schedule and media_publication_get. */
export type PublicationSchedule = {
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  recurrence: Recurrence;
};

/** The payload sent to PUT /media/publications/:id/schedule. */
export type SchedulePayload = {
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  recurrence: Recurrence;
};

/** One overlapping active publication, from POST /media/publications/conflicts. */
export type ScheduleConflict = {
  publication_id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  screens: string[];
  priority: Priority;
  /** If this draft is published, does it fully suppress this conflict (override wins)? */
  would_suppress: boolean;
  /** If this draft is published, is it the one suppressed for the overlap (override loses)? */
  would_be_suppressed: boolean;
  /**
   * Equal priority, shared Media Device, and either side carries a Composition — the two cannot
   * share a screen, so publishing is refused rather than merged (ticket 09, ADR 0044 §8).
   */
  blocks: boolean;
};

export type DraftAssetItem = {
  media_asset_id: string;
  /** Seconds on screen. Images default to 10 and are user-editable; videos stay null
   *  so the backend falls back to the file's own duration. */
  duration_seconds: number | null;
  transition?: "cut" | "fade";
};
