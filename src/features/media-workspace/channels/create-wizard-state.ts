import { ARRANGEMENT_OPTIONS, arrangementByKey, autoMapScreens, buildDisplayConfig, canvasResolution } from "./display-config.ts";
import type { ChannelDetail, ChannelDisplayConfigScreen, ChannelOutputKind } from "./types/index.ts";

export interface CreateChannelDraft {
  outputKind: ChannelOutputKind;
  name: string;
  locationId: string | null;
  description: string;
  displayMode: "single" | "multi";
  arrangementKey: string;
  screenResolution: string;
  /** Multi only — seeded by Auto Map on arrangement/resolution change, then user-editable. */
  screens: ChannelDisplayConfigScreen[];
  playerId: string | null;
}

export const DEFAULT_CREATE_CHANNEL_DRAFT: CreateChannelDraft = {
  outputKind: "screen",
  name: "",
  locationId: null,
  description: "",
  displayMode: "single",
  arrangementKey: "1x3",
  screenResolution: "1920x1080",
  screens: [],
  playerId: null,
};

/** Re-seeds `screens` from Auto Map — call whenever `displayMode`, `arrangementKey` or
 *  `screenResolution` changes, so the mapping table never shows a stale screen count. */
export function withAutoMappedScreens(draft: CreateChannelDraft): CreateChannelDraft {
  if (draft.displayMode === "single") return { ...draft, screens: [] };
  return { ...draft, screens: autoMapScreens(arrangementByKey(draft.arrangementKey), draft.screenResolution) };
}

export function canvasResolutionFor(draft: CreateChannelDraft): string {
  return draft.displayMode === "single"
    ? draft.screenResolution
    : canvasResolution(arrangementByKey(draft.arrangementKey), draft.screenResolution);
}

export function step1Valid(draft: CreateChannelDraft): boolean {
  return draft.name.trim().length > 0;
}

export function step2Valid(draft: CreateChannelDraft): boolean {
  return draft.playerId !== null;
}

export interface CreateChannelPayload {
  name: string;
  description: string | null;
  location_id: string | null;
  player_id: string;
  output_kind: ChannelOutputKind;
  expected_resolution: string | null;
  display_config: ReturnType<typeof buildDisplayConfig> | null;
  // `channelCreateSchema` (Thunder_Core) declares these `.nullable()` but not `.optional()` — the
  // key must be present, `null` or not, or zod 400s. Orientation is always derived server-side
  // now (ADR 0074 §3) and a default playlist has no place in this wizard, so both are always null.
  expected_orientation: null;
  default_playlist_id: null;
}

/** The exact body `POST /media/channels` needs — `expected_resolution` xor `display_config`
 *  depending on Display Mode (`media_core.channel_canvas` refuses both being non-null). */
export function toCreateChannelPayload(draft: CreateChannelDraft): CreateChannelPayload {
  if (!draft.playerId) throw new Error("toCreateChannelPayload: playerId is required");
  const arrangement = arrangementByKey(draft.arrangementKey);
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    location_id: draft.locationId,
    player_id: draft.playerId,
    output_kind: draft.outputKind,
    expected_resolution: draft.displayMode === "single" ? draft.screenResolution : null,
    display_config: draft.displayMode === "multi" ? buildDisplayConfig(arrangement, draft.screens) : null,
    expected_orientation: null,
    default_playlist_id: null,
  };
}

export interface UpdateChannelPayload extends CreateChannelPayload {
  expected_revision: number;
  overwrite: boolean;
}

/** `PATCH /media/channels/:id` — `channelUpdateSchema` is `channelCreateSchema` plus
 *  `expected_revision`/`overwrite`, same always-present-nullable fields. `overwrite` is always
 *  `false` here: this editor has no conflict-resolution UI, so a stale revision surfaces as an
 *  ordinary save error instead of silently clobbering a concurrent edit. */
export function toUpdateChannelPayload(draft: CreateChannelDraft, expectedRevision: number): UpdateChannelPayload {
  return { ...toCreateChannelPayload(draft), expected_revision: expectedRevision, overwrite: false };
}

/** Seeds the editor from the Channel Core v2 already returned — the inverse of
 *  `toCreateChannelPayload`/`toUpdateChannelPayload`. A legacy Channel with no `display_config` but
 *  more than one `devices[]` entry has no wizard-shape representation yet (ticket 09 scope: the
 *  one-Player model only) and is not expected to reach this editor. */
export function draftFromChannel(channel: ChannelDetail): CreateChannelDraft {
  const displayMode: CreateChannelDraft["displayMode"] = channel.display_config ? "multi" : "single";
  const arrangement = channel.display_config?.arrangement;
  const arrangementKey =
    (arrangement && ARRANGEMENT_OPTIONS.find((option) => option.rows === arrangement.rows && option.cols === arrangement.cols)?.key) ??
    DEFAULT_CREATE_CHANNEL_DRAFT.arrangementKey;
  const screenResolution =
    channel.display_config?.screens[0]?.resolution ?? channel.expected_resolution ?? DEFAULT_CREATE_CHANNEL_DRAFT.screenResolution;
  return {
    outputKind: channel.output_kind,
    name: channel.name,
    locationId: channel.location?.id ?? null,
    description: channel.description ?? "",
    displayMode,
    arrangementKey,
    screenResolution,
    screens: channel.display_config?.screens ?? [],
    playerId: channel.player?.id ?? null,
  };
}
