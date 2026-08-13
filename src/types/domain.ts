// Shared domain entity types, used by 2+ features. Mirrors the glossary in
// CONTEXT.md at the repo root — keep both in sync when either changes.

export type ChannelType = "dooh" | "in_store" | "online" | "social" | "other";
export type ChannelOnlineStatus = "online" | "warning" | "offline";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  locationName: string;
  status: ChannelOnlineStatus;
}

// Publication's own lifecycle status — separate from Publish Job delivery
// status. See CONTEXT.md: "Publication".
export type PublicationLifecycleStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled";

// Publish Job delivery status — one Job per Channel x Device. See
// CONTEXT.md: "Publish Job".
export type PublishJobStatus =
  | "queued"
  | "processing"
  | "downloading"
  | "delivered"
  | "playing"
  | "failed"
  | "cancelled";

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
  created_at?: string;
  file?: {
    id?: string;
    original_filename?: string;
    mime_type?: string;
    file_size_bytes?: number;
    checksum?: string;
  };
};
