// Encode/decode for `media_core.playlists.metadata` — the jsonb column that carries every
// playlist field with no column of its own. See docs/adr/0010-playlist-settings-in-metadata.md.
//
// Wire shape: { v: 1, info: {...}, playback: {...} }, snake_case, with only the keys that
// actually have a value. Pre-existing rows hold `{}` and must decode to empty, not crash.

import type {
  PlaylistInfo,
  PlaylistItem,
  PlaylistMetadata,
  PlaylistPlayback,
} from "./types";
import { PLAY_MODES, PLAYLIST_TYPES, REPEAT_MODES, START_FROMS } from "./types";
import { parseResolution } from "./output-profile.ts";

export const METADATA_VERSION = 1;

type Json = Record<string, unknown>;

function put(target: Json, key: string, value: unknown): void {
  if (value === undefined || value === null || value === "") return;
  if (Array.isArray(value) && value.length === 0) return;
  target[key] = value;
}

function str(source: Json, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function num(source: Json, key: string): number | undefined {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function bool(source: Json, key: string): boolean | undefined {
  const value = source[key];
  return typeof value === "boolean" ? value : undefined;
}

/** Narrows a wire string to one of the allowed literals, dropping anything unrecognised. */
function oneOf<T extends string>(
  source: Json,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = source[key];
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function obj(source: Json, key: string): Json {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

export function encodeMetadata(metadata: PlaylistMetadata): Json {
  const info: Json = {};
  put(info, "description", metadata.info.description);
  put(info, "campaign_id", metadata.info.campaignId);
  put(info, "tags", metadata.info.tags);
  put(info, "playlist_type", metadata.info.playlistType);
  put(info, "resolution", metadata.info.resolution);
  // width/height are derived from resolution, not a second thing the caller can set — one
  // canonical value (resolution) in, two representations out (ADR 0032).
  const dimensions = parseResolution(metadata.info.resolution);
  if (dimensions) {
    put(info, "width", dimensions.width);
    put(info, "height", dimensions.height);
  }
  put(info, "frame_rate", metadata.info.frameRate);
  put(info, "cover_asset_id", metadata.info.coverAssetId);

  const playback: Json = {};
  put(playback, "play_mode", metadata.playback.playMode);
  put(playback, "repeat", metadata.playback.repeat);
  put(playback, "start_from", metadata.playback.startFrom);
  put(playback, "default_image_duration", metadata.playback.defaultImageDuration);
  put(playback, "media_fit", metadata.playback.mediaFit);
  put(playback, "audio_enabled", metadata.playback.audioEnabled);
  put(playback, "default_volume", metadata.playback.defaultVolume);
  put(playback, "default_transition", metadata.playback.defaultTransition);
  put(playback, "transition_duration", metadata.playback.transitionDuration);
  put(playback, "failure_handling", metadata.playback.failureHandling);
  put(playback, "warn_on_skip", metadata.playback.warnOnSkip);

  const encoded: Json = { v: METADATA_VERSION };
  if (Object.keys(info).length > 0) encoded.info = info;
  if (Object.keys(playback).length > 0) encoded.playback = playback;
  return encoded;
}

/**
 * Reads a metadata blob back. Unknown versions decode to empty rather than throwing —
 * a playlist with settings we cannot read is still a playlist worth listing.
 */
export function decodeMetadata(raw: unknown): PlaylistMetadata {
  const empty: PlaylistMetadata = { info: {}, playback: {} };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;

  const source = raw as Json;
  if (num(source, "v") !== METADATA_VERSION) return empty;

  const rawInfo = obj(source, "info");
  const rawPlayback = obj(source, "playback");
  const tags = rawInfo.tags;

  const info: PlaylistInfo = {
    description: str(rawInfo, "description"),
    campaignId: str(rawInfo, "campaign_id"),
    tags: Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : undefined,
    playlistType: oneOf(rawInfo, "playlist_type", PLAYLIST_TYPES),
    resolution: str(rawInfo, "resolution"),
    // Prefer the stored numbers; fall back to parsing resolution for rows written before
    // width/height existed. Either way the caller always gets numbers, never has to parse.
    width: num(rawInfo, "width") ?? parseResolution(str(rawInfo, "resolution"))?.width,
    height: num(rawInfo, "height") ?? parseResolution(str(rawInfo, "resolution"))?.height,
    frameRate: num(rawInfo, "frame_rate"),
    coverAssetId: str(rawInfo, "cover_asset_id"),
  };

  const playback: PlaylistPlayback = {
    playMode: oneOf(rawPlayback, "play_mode", PLAY_MODES),
    repeat: oneOf(rawPlayback, "repeat", REPEAT_MODES),
    startFrom: oneOf(rawPlayback, "start_from", START_FROMS),
    defaultImageDuration: num(rawPlayback, "default_image_duration"),
    mediaFit: oneOf(rawPlayback, "media_fit", ["fit", "fill", "stretch"]),
    audioEnabled: bool(rawPlayback, "audio_enabled"),
    defaultVolume: num(rawPlayback, "default_volume"),
    defaultTransition: oneOf(rawPlayback, "default_transition", ["cut", "fade"]),
    transitionDuration: num(rawPlayback, "transition_duration"),
    failureHandling: oneOf(rawPlayback, "failure_handling", ["skip", "stop"]),
    warnOnSkip: bool(rawPlayback, "warn_on_skip"),
  };

  return { info, playback };
}

/**
 * Which asset represents this playlist. An explicit pick wins; otherwise the item at the
 * lowest position. Resolved on read so reordering items never rewrites metadata.
 */
export function resolveCoverAssetId(
  coverAssetId: string | undefined,
  items: Pick<PlaylistItem, "media_asset_id" | "position">[]
): string | undefined {
  if (coverAssetId) return coverAssetId;
  if (items.length === 0) return undefined;
  return items.reduce((lowest, item) =>
    item.position < lowest.position ? item : lowest
  ).media_asset_id;
}
