"use client";

import { useCallback, useMemo, useState } from "react";

/** Minimal undo/redo over a single value. Every commit pushes the old present onto `past` and
 *  clears `future`. ponytail: no coalescing / no depth cap — a playlist edit session is short. */

export type History<T> = { past: T[]; present: T; future: T[] };

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function commitHistory<T>(s: History<T>, value: T): History<T> {
  if (Object.is(value, s.present)) return s;
  return { past: [...s.past, s.present], present: value, future: [] };
}

export function undoHistory<T>(s: History<T>): History<T> {
  if (s.past.length === 0) return s;
  return {
    past: s.past.slice(0, -1),
    present: s.past[s.past.length - 1],
    future: [s.present, ...s.future],
  };
}

export function redoHistory<T>(s: History<T>): History<T> {
  if (s.future.length === 0) return s;
  const [next, ...rest] = s.future;
  return { past: [...s.past, s.present], present: next, future: rest };
}

export type UndoableState<T> = {
  present: T;
  canUndo: boolean;
  canRedo: boolean;
  commit: (next: T | ((current: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  /** Drop history and set a new baseline — used after a load or a successful save. */
  reset: (next: T) => void;
};

export function useUndoableState<T>(initial: T): UndoableState<T> {
  const [state, setState] = useState<History<T>>(() => initHistory(initial));

  const commit = useCallback((next: T | ((current: T) => T)) => {
    setState((s) => commitHistory(s, typeof next === "function" ? (next as (current: T) => T)(s.present) : next));
  }, []);
  const undo = useCallback(() => setState(undoHistory), []);
  const redo = useCallback(() => setState(redoHistory), []);
  const reset = useCallback((next: T) => setState(initHistory(next)), []);

  return useMemo(
    () => ({
      present: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      commit,
      undo,
      redo,
      reset,
    }),
    [state, commit, undo, redo, reset],
  );
}
