import type {
  Priority,
  PublicationDetail,
  PublicationSchedule,
  PublicationTarget,
  PublicationType,
} from "./types";
import type { checkScheduleConflicts } from "./services/publications-api";

export type ProgramItemDraft = {
  media_asset_id: string;
  duration_seconds: number | null;
  transition: string;
};

/** What the Program plays. Only the field matching `type` is meaningful. */
export type ProgramContent = {
  type: PublicationType;
  /** Name of the bound Playlist / Layout, kept here so a Change shows the new name before saving. */
  name: string | null;
  playlistId: string | null;
  compositionId: string | null;
  /** video / image Programs: the backend takes the items, not a Playlist id (BE-2 contract). */
  items: ProgramItemDraft[];
};

/**
 * The whole Program as the Edit page holds it (ADR 0080). One object on purpose: the backend takes
 * the whole Program on every call, and dirty tracking is a comparison against the copy taken at
 * load. FE-C/D/E replace `content` / `targets` / `schedule` without touching the rest.
 */
export type ProgramEditState = {
  name: string;
  description: string;
  tags: string[];
  priority: Priority;
  content: ProgramContent;
  targets: PublicationTarget[];
  schedule: PublicationSchedule | null;
};

type PlaylistItemLike = {
  media_asset_id: string;
  position: number;
  duration_seconds?: number | null;
  transition?: string | null;
};

function toItemDrafts(playlistItems: PlaylistItemLike[]): ProgramItemDraft[] {
  return [...playlistItems]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      media_asset_id: item.media_asset_id,
      duration_seconds: item.duration_seconds ?? null,
      transition: item.transition ?? "cut",
    }));
}

/** Content after "Change Playlist" — same type, new Playlist. */
export function playlistContent(playlist: { id: string; name: string; items: PlaylistItemLike[] }): ProgramContent {
  return {
    type: "playlist",
    name: playlist.name,
    playlistId: playlist.id,
    compositionId: null,
    items: toItemDrafts(playlist.items),
  };
}

/** Content after "Change Layout" — same type, new Layout. */
export function compositionContent(composition: { id: string; name: string }): ProgramContent {
  return { type: "composition", name: composition.name, playlistId: null, compositionId: composition.id, items: [] };
}

export function detailToEditState(
  detail: PublicationDetail,
  playlistItems: PlaylistItemLike[] = [],
): ProgramEditState {
  const items = toItemDrafts(playlistItems);

  return {
    name: detail.name,
    description: detail.description ?? "",
    tags: detail.tags ?? [],
    priority: detail.priority,
    content: {
      type: detail.publication_type,
      name: (detail.publication_type === "composition" ? detail.composition?.name : detail.playlist?.name) ?? null,
      playlistId: detail.playlist?.id ?? null,
      compositionId: detail.composition?.id ?? null,
      items,
    },
    targets: detail.publication_targets ?? [],
    schedule: detail.schedule ?? null,
  };
}

// ponytail: structural compare through JSON — state is plain data built by one function, so key
// order is stable; swap for a deep-equal if a field ever holds a Date or a Map.
export function isProgramDirty(baseline: ProgramEditState, current: ProgramEditState): boolean {
  return JSON.stringify(baseline) !== JSON.stringify(current);
}

/** Only id fields go over the wire: the route's zod schema drops `name`, and a stale name would lie. */
function wireTarget(target: PublicationTarget): Record<string, string> {
  const wire: Record<string, string> = { target_type: target.target_type };
  if (target.channel_id) wire.channel_id = target.channel_id;
  if (target.device_id) wire.device_id = target.device_id;
  if (target.group_id) wire.group_id = target.group_id;
  return wire;
}

/** Body for `POST /media/publications/:id/update-published` — never `campaign_id`, `language`, `metadata`. */
export function buildUpdatePublishedBody(
  state: ProgramEditState,
  expectedRevision: number,
): Record<string, unknown> {
  const { schedule, content } = state;
  if (!schedule) throw new Error("A published Program always has a schedule");

  const body: Record<string, unknown> = {
    expected_revision: expectedRevision,
    name: state.name.trim(),
    description: state.description.trim() || null,
    priority: state.priority,
    tags: state.tags,
    publication_type: content.type,
    targets: state.targets.map(wireTarget),
    starts_at: schedule.starts_at,
    ends_at: schedule.ends_at,
    timezone: schedule.timezone,
    recurrence: schedule.recurrence,
  };

  if (content.type === "playlist") body.playlist_id = content.playlistId;
  else if (content.type === "composition") body.composition_id = content.compositionId;
  else body.items = content.items;

  return body;
}

function targetKey(target: PublicationTarget): string {
  return `${target.target_type}:${target.channel_id ?? target.device_id ?? target.group_id ?? ""}`;
}

/** Labels of stored Targets the edit dropped — a Group counts once, by name (ADR 0080 confirm modal). */
export function removedTargetLabels(
  stored: PublicationTarget[],
  edited: PublicationTarget[],
): string[] {
  const kept = new Set(edited.map(targetKey));
  return stored.filter((t) => !kept.has(targetKey(t))).map((t) => t.name || targetKey(t));
}

export type UpdatePublishedFailure = {
  /** Set when the backend tagged the message `[details]`, `[content]`, `[targets]`, `[schedule]`
   *  or `[publish]`; the card to bind the error to. */
  part: "details" | "content" | "targets" | "schedule" | "publish" | null;
  /** True for `Already modified:` — reload, do not retry. */
  isStale: boolean;
  message: string;
};

const PART_TAG = /\[(details|content|targets|schedule|publish)\]\s*/;

export function parseUpdatePublishedError(raw: string): UpdatePublishedFailure {
  const isStale = raw.startsWith("Already modified:");
  const match = PART_TAG.exec(raw);
  return {
    part: match ? (match[1] as UpdatePublishedFailure["part"]) : null,
    isStale,
    message: match ? raw.replace(PART_TAG, "") : raw,
  };
}

type ChannelLike = {
  id: string;
  player: { id: string } | null;
  groups?: { id: string }[];
};

/** Devices the edited Targets reach. Groups are expanded through Channel membership: the conflict
 *  check is device-level, and a Channels-only list misses every Group member (ADR 0080). */
export function targetDeviceIds(channels: ChannelLike[], targets: PublicationTarget[]): string[] {
  const ids = new Set<string>();
  for (const target of targets) {
    if (target.target_type === "device" && target.device_id) ids.add(target.device_id);
    for (const channel of channels) {
      const hit =
        (target.target_type === "channel" && channel.id === target.channel_id) ||
        (target.target_type === "group" && channel.groups?.some((g) => g.id === target.group_id));
      if (hit && channel.player) ids.add(channel.player.id);
    }
  }
  return [...ids];
}

/** Each dialog open resolves Channel/Group membership afresh; failed lookup stays a failed check. */
export async function checkEditConflicts(
  publicationId: string,
  state: Pick<ProgramEditState, "schedule" | "targets" | "priority">,
  loadChannels: () => Promise<ChannelLike[]>,
  check: typeof checkScheduleConflicts,
) {
  if (!state.schedule) return [];
  const channels = state.targets.some((target) => target.target_type !== "device")
    ? await loadChannels()
    : [];
  return check({
    publication_id: publicationId,
    device_ids: targetDeviceIds(channels, state.targets),
    starts_at: state.schedule.starts_at,
    ends_at: state.schedule.ends_at,
    recurrence: state.schedule.recurrence,
    timezone: state.schedule.timezone,
    priority: state.priority,
  });
}
