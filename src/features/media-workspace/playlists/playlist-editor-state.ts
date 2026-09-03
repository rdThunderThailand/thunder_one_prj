// Pure state helpers for the Playlist editor page — kept out of the component so the
// reordering and hydration logic has one runnable check behind it.

import type { MediaAsset } from "../../../types/domain.ts";
import type { PlaylistDetail } from "./types";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "./types";
import { playlistDetailToDraftFields } from "./draft-from-detail.ts";

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

/** Loop length for the header, resolving each item's duration against its asset (ADR 0051 §3). */
export function totalItemsDurationSeconds(items: DraftItem[], assets: MediaAsset[]): number {
  const byId = new Map(assets.map((a) => [a.id, a.duration_seconds]));
  return items.reduce((sum, item) => sum + Math.max(0, item.durationSeconds ?? byId.get(item.mediaAssetId) ?? 0), 0);
}

/** Move an item within the list, no-op on an out-of-range target. */
export function moveItem(items: DraftItem[], from: number, to: number): DraftItem[] {
  if (from === to || to < 0 || to >= items.length || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
