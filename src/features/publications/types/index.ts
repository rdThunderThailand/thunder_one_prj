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
