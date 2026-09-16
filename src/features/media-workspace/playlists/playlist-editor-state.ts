// Pure state helpers for the Playlist editor page — kept out of the component so the
// reordering and hydration logic has one runnable check behind it.

import type { MediaAsset } from "../../../types/domain.ts";
import type { PlaylistDetail } from "./types";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "./types";
import { playlistDetailToDraftFields } from "./draft-from-detail.ts";
import { zoneSchedule } from "../preview/preview-clock.ts";

/** Same seed the editor's own live preview uses (`playlist-preview.ts`'s Zone id) — the header's
 *  numbers and the embedded PreviewStage must agree on the schedule, not just the model (ADR 0062 §1/§5). */
const EDITOR_SCHEDULE_SEED = "playlist-preview";

export type EditorState = { name: string; items: DraftItem[]; playback: PlaylistPlayback };

export const DEFAULT_IMAGE_DURATION_SECONDS = 10;

export function defaultPlayback(): PlaylistPlayback {
  return { playMode: "sequential", repeat: "loop", startFrom: "first", defaultTransition: "fade", transitionDuration: 1 };
}

export function emptyEditorState(): EditorState {
  return { name: "", items: [], playback: defaultPlayback() };
}

/** A loaded row becomes editor state; playlist-level playback defaults fill any gap so the
 *  right pane always has a value to show. */
export function editorStateFromDetail(detail: PlaylistDetail): {
  state: EditorState;
  revision: number;
  info: PlaylistInfo;
} {
  const fields = playlistDetailToDraftFields(detail);
  return {
    state: { name: fields.name, items: fields.items, playback: { ...defaultPlayback(), ...fields.playback } },
    revision: fields.revision,
    info: fields.info,
  };
}

/** The dirty-check / saved-baseline serialisation — one definition so every call site agrees. */
export function editorSnapshot(state: EditorState): string {
  return JSON.stringify(state);
}

/** The header's save-state text (#33: "the header shows when the Playlist was last saved"). */
export function savedStateLabel(isDirty: boolean, lastSavedAt: Date | null, hasRow: boolean): string {
  if (isDirty) return "unsaved changes";
  if (lastSavedAt) return `saved ${lastSavedAt.toLocaleTimeString()}`;
  return hasRow ? "saved" : "not saved yet";
}

function toScheduleItems(items: DraftItem[], assets: MediaAsset[]) {
  const byId = new Map(assets.map((a) => [a.id, a.duration_seconds]));
  return items.map((item) => ({
    mediaAssetId: item.mediaAssetId,
    durationSeconds: item.durationSeconds ?? byId.get(item.mediaAssetId) ?? 0,
    transition: item.transition,
    transitionDurationSeconds: item.transitionDurationSeconds ?? null,
  }));
}

function toScheduleSettings(playback: PlaylistPlayback) {
  return {
    playMode: playback.playMode,
    repeat: playback.repeat,
    defaultTransition: playback.defaultTransition,
    transitionDurationSeconds: playback.transitionDuration,
  };
}

/** Loop length for the header — media plus transitions, the same rule `zoneSchedule()` gives the
 *  preview (ADR 0062 §1/§5). */
export function totalItemsDurationSeconds(items: DraftItem[], assets: MediaAsset[], playback: PlaylistPlayback): number {
  return zoneSchedule(toScheduleItems(items, assets), toScheduleSettings(playback), EDITOR_SCHEDULE_SEED).totalSeconds;
}

/** Start second of each item, indexed by **authored** order (§1: "the filmstrip seeks with
 *  `schedule.starts[schedule.order.indexOf(authoredIndex)]`"). */
export function itemStartSeconds(items: DraftItem[], assets: MediaAsset[], playback: PlaylistPlayback): number[] {
  const schedule = zoneSchedule(toScheduleItems(items, assets), toScheduleSettings(playback), EDITOR_SCHEDULE_SEED);
  const starts = new Array<number>(items.length);
  schedule.order.forEach((authoredIndex, k) => { starts[authoredIndex] = schedule.starts[k]; });
  return starts;
}

/** #35: assets picked in the Add Item drawer land at the end, in selection order, skipping
 *  any already present. A video's per-item duration starts `null` (inherit the clip length);
 *  an image starts from the playlist's default image duration. */
export function appendItems(
  items: DraftItem[],
  picked: { id: string; title?: string; kind?: "video" | "image" }[],
  playback: PlaylistPlayback,
): DraftItem[] {
  const have = new Set(items.map((i) => i.mediaAssetId));
  const additions = picked
    .filter((a) => !have.has(a.id))
    .map((a): DraftItem => ({
      mediaAssetId: a.id,
      title: a.title,
      kind: a.kind,
      durationSeconds:
        a.kind === "video" ? null : (playback.defaultImageDuration ?? DEFAULT_IMAGE_DURATION_SECONDS),
      transition: playback.defaultTransition ?? "fade",
    }));
  return additions.length ? [...items, ...additions] : items;
}

/** Move an item within the list, no-op on an out-of-range target. */
export function moveItem(items: DraftItem[], from: number, to: number): DraftItem[] {
  if (from === to || to < 0 || to >= items.length || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
