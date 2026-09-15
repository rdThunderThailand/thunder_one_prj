/** ADR 0074 §5. */
export type PlaybackMode = "synchronized" | "independent";
export type GroupStatus = "active" | "disabled";

export interface ChannelGroupMember {
  id: string;
  name: string;
}

export interface ChannelGroup {
  id: string;
  name: string;
  description: string | null;
  status: GroupStatus;
  playback_mode: PlaybackMode;
  members: ChannelGroupMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelGroupCreateInput {
  name: string;
  description?: string | null;
  playback_mode: PlaybackMode;
}

export interface ChannelGroupUpdateInput {
  name?: string;
  description?: string | null;
  playback_mode?: PlaybackMode;
  status?: GroupStatus;
}
