"use client";

// Ticket 26 (ADR 0063 §5): undo/redo over the Zone array — geometry and naming both, since
// both are edited through the same `onChange`. Client-only, no contract: a state stack for
// the length of the editor session.
//
// Lives at the editor root (used from CompositionEditorPage) rather than inside
// CompositionCanvasPane, because ticket 27's Layout tab also mutates Zone geometry and both
// need to land on the same stack.

import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";

export function useZoneHistory(zones: LayoutZone[], onChange: (next: LayoutZone[]) => void) {
  const [past, setPast] = useState<LayoutZone[][]>([]);
  const [future, setFuture] = useState<LayoutZone[][]>([]);
  // Tracks the latest `zones` prop for the stack pushes below, without making every
  // keystroke of a drag depend on it — refs write in an effect, never during render.
  const zonesRef = useRef(zones);
  useEffect(() => {
    zonesRef.current = zones;
  });

  /** Call once per gesture, before the mutation — the checkpoint Undo returns to. */
  const checkpoint = useCallback(() => {
    setPast((prev) => [...prev, zonesRef.current]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1]!;
      setFuture((f) => [zonesRef.current, ...f]);
      onChange(previous);
      return prev.slice(0, -1);
    });
  }, [onChange]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      setPast((p) => [...p, zonesRef.current]);
      onChange(next!);
      return rest;
    });
  }, [onChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (key === "z") {
        event.preventDefault();
        undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return { checkpoint, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
