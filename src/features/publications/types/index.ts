export const PUBLICATION_TYPES = [
  "image",
  "video",
  "playlist",
  "html",
  "dynamic",
] as const;

export type PublicationType = (typeof PUBLICATION_TYPES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

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

export type BasicInfoForm = {
  name: string;
  description?: string;
  campaign_id?: string;
  publication_type?: PublicationType;
  priority?: Priority;
  language?: string;
  tags?: string[];
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
  status?: string;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  file?: {
    id?: string;
    original_filename?: string;
    mime_type?: string;
    file_size_bytes?: number;
    checksum?: string;
  };
};

export type PublicationListItem = {
  id: string;
  name: string;
  status: string;
  publication_type: PublicationType;
  priority: Priority;
  language?: string;
  campaign_id?: string;
  campaign_name?: string;
  playlist_id?: string;
  item_count: number;
  tags: string[];
  created_at?: string;
  updated_at?: string;
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
  status: string;
  playlist?: { id: string; name: string } | null;
  tags: string[];
  created_at?: string;
  activated_at?: string;
  job_status?: string;
  /** Delivery status per device — populated only after activation. */
  targets?: unknown[];
  /** The publication's own targets, saved in step 3. */
  publication_targets?: PublicationTarget[];
};

export type Screen = {
  id: string;
  name: string;
  connection_status?: string;
  status_level?: "online" | "warning" | "offline";
  last_heartbeat_at?: string | null;
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
