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
