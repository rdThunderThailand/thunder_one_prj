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
  [key: string]: unknown;
};

export type Screen = {
  id: string;
  name?: string;
  is_online?: boolean;
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
  [key: string]: unknown;
};

export type PlayerJob = {
  target_id?: string;
  id?: string;
  file?: PlayerJobFile;
  [key: string]: unknown;
};

export type PlaybackLogInput = {
  media_asset_id: string;
  played_at: string;
  duration_played_seconds: number;
};
