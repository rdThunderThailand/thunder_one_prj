export type LogEntry = {
  id: string;
  at: string; // ISO time string
  method: string;
  url: string;
  status: number | null;
  ms: number;
  request: unknown;
  response: unknown;
  ok: boolean;
};

export type ConfigInfo = {
  coreApiUrl: string;
  hasKey: boolean;
};

export type VideoUploadUrlResponse = {
  file_id: string;
  storage_key: string;
  upload_url: string;
  token?: string;
};

export type Video = {
  id: string;
  file_id?: string;
  title?: string;
  name?: string;
  status?: string;
  created_at?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  codec?: string;
  kind?: "video" | "image" | string;
  approval_status?: "draft" | "pending" | "approved" | "rejected" | string;
  language?: string;
  [key: string]: unknown;
};

export type Screen = {
  id: string;
  name?: string;
  is_online?: boolean;
  status_level?: "online" | "warning" | "offline" | string;
  [key: string]: unknown;
};

export type PlaylistItem = {
  media_asset_id: string;
  position: number;
  duration_seconds?: number;
  transition?: string;
};

export type Playlist = {
  id: string;
  name?: string;
  items?: PlaylistItem[];
  [key: string]: unknown;
};

export type PublicationTargetInput = {
  target_type: "device" | "channel";
  device_id?: string;
  channel_id?: string;
};

export type PublicationTarget = {
  target_type?: string;
  device_id?: string;
  channel_id?: string;
  status?: string;
  [key: string]: unknown;
};

export type Publication = {
  id: string;
  playlist_id?: string;
  targets?: PublicationTarget[];
  status?: string;
  [key: string]: unknown;
};

export type PlayerJobFile = {
  url?: string;
  bucket_name?: string;
  storage_key?: string;
  checksum?: string;
  mime_type?: string;
  original_filename?: string;
  [key: string]: unknown;
};

export type PlayerJob = {
  target_id?: string;
  id?: string;
  file?: PlayerJobFile;
  [key: string]: unknown;
};

export type PlayerSlot = {
  start_offset_seconds: number;
  duration_seconds: number;
  kind?: "video" | "image" | string;
  transition?: string;
  publication_id?: string;
  target_id?: string;
  media_asset_id?: string;
  file?: PlayerJobFile;
  [key: string]: unknown;
};

export type PlayerPollResponse = {
  device_id?: string;
  loop_duration_seconds?: number;
  slots?: PlayerSlot[];
  jobs?: PlayerJob[];
  [key: string]: unknown;
};

export type PlaybackLogInput = {
  media_asset_id: string;
  played_at: string;
  duration_played_seconds: number;
};
