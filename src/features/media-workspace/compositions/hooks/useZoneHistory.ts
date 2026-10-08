"use client";

// ADR 0087 (amends ADR 0063 §5): undo/redo over the whole Composition document — Zone
// geometry and names, layout settings and Zone bindings as one snapshot. Client-only, no
// contract: a state stack for the length of the editor session, capped at HISTORY_LIMIT.
//
// Snapshots hold the editor's *raw* draft state (`editedZones` / `layoutSettings` are null until
// touched), never the computed layout: restoring computed values would turn an undone content
// change into a geometry edit and the next Save would write a shared Template unasked.
//
// Lives at the editor root (used from CompositionEditorPage) rather than inside
// CompositionCanvasPane, because ticket 27's Layout tab also mutates Zone geometry and both
// need to land on the same stack.

import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import { useShortcutPlatform } from "@/components/layout/ShortcutPlatform";
import { isModShortcut, isTypingTarget } from "@/lib/keyboard-shortcut";
import type { LayoutSettingsDraft } from "../save-composition";
import type { ZoneBindingDraft } from "../zone-bindings";

export type EditorSnapshot = {
  editedZones: LayoutZone[] | null;
  layoutSettings: LayoutSettingsDraft | null;
  bindings: ZoneBindingDraft[];
};

const HISTORY_LIMIT = 100;

export function useZoneHistory(snapshot: EditorSnapshot, onRestore: (next: EditorSnapshot) => void) {
  const stacks = useRef<{ past: EditorSnapshot[]; future: EditorSnapshot[] }>({ past: [], future: [] });
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false });
  // Latest snapshot for the pushes below, without making every keystroke of a drag depend on
  // it — refs write in an effect, never during render.
  const snapshotRef = useRef(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  });
  // A continuous edit (typing a number, dragging a color) keeps one step for as long as focus
  // stays where it is; any focus move starts the next one.
  const continuousKey = useRef<string | null>(null);

  const sync = () => setFlags({ canUndo: stacks.current.past.length > 0, canRedo: stacks.current.future.length > 0 });

  /** Call once per action, before the mutation — the checkpoint Undo returns to. With `key`, a
   *  repeat of the same continuous edit (same key, no focus change since) adds no step. */
  const checkpoint = useCallback((key?: string) => {
    if (key !== undefined && continuousKey.current === key) return;
    continuousKey.current = key ?? null;
    const { past } = stacks.current;
    past.push(snapshotRef.current);
    if (past.length > HISTORY_LIMIT) past.shift();
    stacks.current.future = [];
    sync();
  }, []);

  const undo = useCallback(() => {
    const previous = stacks.current.past.pop();
    if (!previous) return;
    continuousKey.current = null;
    stacks.current.future.unshift(snapshotRef.current);
    sync();
    onRestore(previous);
  }, [onRestore]);

  const redo = useCallback(() => {
    const next = stacks.current.future.shift();
    if (!next) return;
    continuousKey.current = null;
    stacks.current.past.push(snapshotRef.current);
    sync();
    onRestore(next);
  }, [onRestore]);

  /** Drops both stacks — after a save or fork the old snapshots carry Zone ids that no longer exist. */
  const reset = useCallback(() => {
    stacks.current = { past: [], future: [] };
    continuousKey.current = null;
    sync();
  }, []);

  // Undo ⌘Z / Ctrl+Z; redo ⇧⌘Z on Apple, Ctrl+Y or Ctrl+Shift+Z elsewhere (lib/keyboard-shortcut).
  // Text fields keep their own undo: a Zone name being typed is not rolled back as geometry.
  const platform = useShortcutPlatform();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (
        isModShortcut(event, "z", platform, { shift: true }) ||
        (platform === "other" && isModShortcut(event, "y", platform))
      ) {
        event.preventDefault();
        redo();
      } else if (isModShortcut(event, "z", platform)) {
        event.preventDefault();
        undo();
      }
    };
    const endContinuousEdit = () => {
      continuousKey.current = null;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("focusin", endContinuousEdit);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focusin", endContinuousEdit);
    };
  }, [undo, redo, platform]);

  return { checkpoint, undo, redo, reset, canUndo: flags.canUndo, canRedo: flags.canRedo };
}
