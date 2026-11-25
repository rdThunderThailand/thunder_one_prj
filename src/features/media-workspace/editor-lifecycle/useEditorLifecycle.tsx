"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { classifyApiError } from "@/lib/api/api-error";
import {
  createSaveSlot,
  ensureSavedWith,
  failureKind,
  initialLifecycle,
  lifecycleStatus,
  reduceLifecycle,
  savedBaseline,
  type LifecycleStatus,
} from "./editor-lifecycle";
import { UnsavedLeaveConfirm } from "./components/UnsavedLeaveConfirm";
import { useLeaveGuard } from "./useLeaveGuard";

type LifecycleOptions<S, I, R> = {
  /** Current draft content; compared via `JSON.stringify`. */
  snapshot: S;
  /** `false` = a new editor that was never saved. */
  hasRow: boolean;
  /** The editor's adapter; throws on failure. */
  write: (snapshot: S, intent?: I) => Promise<R>;
  /** Omitted = the editor has no revision to conflict on (Layout). */
  reload?: () => Promise<void>;
  fallbackError: string;
  /** Toast, navigate and replaceState stay with the editor. */
  onSaved?: (result: R, intent?: I) => void;
  /** Baseline after a save when the write changes its own draft; omitted = the snapshot the save started with. */
  savedSnapshot?: (start: S, result: R) => S;
};

export type EditorLifecycle<S, I, R> = {
  status: LifecycleStatus;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
  /** `null` = the save failed; `saveError` or `conflict` is set. `snapshot` overrides the rendered one. */
  save: (intent?: I, snapshot?: S) => Promise<R | null>;
  /** Save before publish: not dirty → `true` with no write. */
  ensureSaved: () => Promise<boolean>;
  saveError: string | null;
  conflict: string | null;
  reloadFromServer: () => Promise<void>;
  /** A newer write elsewhere in the editor took over the error slot. */
  clearError: () => void;
  /** After a load / hydrate / reload. */
  resetBaseline: (snapshot: S) => void;
  /** The editor's own back button. */
  requestLeave: (href: string) => void;
  /** `UnsavedLeaveConfirm` while a leave is pending. */
  leaveDialog: ReactNode;
};

/** The save lifecycle shared by the Playlist, Composition and Layout editors (ADR 0127). */
export function useEditorLifecycle<S, I = undefined, R = void>(options: LifecycleOptions<S, I, R>): EditorLifecycle<S, I, R> {
  const { snapshot, hasRow, reload } = options;
  const router = useRouter();
  const [state, dispatch] = useReducer(reduceLifecycle, snapshot, (first) => initialLifecycle(JSON.stringify(first)));
  const current = JSON.stringify(snapshot);
  const isDirty = current !== state.baseline;

  // The slot outlives renders, so it calls whatever `run` the latest render defined.
  const run = async (intent: I | undefined, toSave: S): Promise<R | null> => {
    dispatch({ type: "save-start" });
    let result: R;
    try {
      result = await options.write(toSave, intent);
    } catch (err) {
      const classified = classifyApiError(err, options.fallbackError);
      dispatch({ type: "save-failure", kind: failureKind(classified.kind, !!reload), message: classified.message });
      return null;
    }
    dispatch({ type: "save-success", baseline: savedBaseline(toSave, result, options.savedSnapshot), at: new Date() });
    options.onSaved?.(result, intent);
    return result;
  };
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  const slotRef = useRef<((intent: I | undefined, toSave: S) => Promise<R | null>) | null>(null);

  const save = (intent?: I, override?: S) => {
    slotRef.current ??= createSaveSlot((nextIntent: I | undefined, toSave: S) => runRef.current(nextIntent, toSave));
    return slotRef.current(intent, override ?? snapshot);
  };
  const ensureSaved = () => ensureSavedWith(isDirty, () => save());
  const resetBaseline = (next: S) => dispatch({ type: "reset", baseline: JSON.stringify(next) });
  const clearError = () => dispatch({ type: "clear-error" });
  // A failed reload shows as an error and leaves the conflict card (and its Reload button) in place.
  const reloadFromServer = async () => {
    try {
      await reload?.();
    } catch (err) {
      dispatch({ type: "save-failure", kind: "error", message: classifyApiError(err, options.fallbackError).message });
    }
  };

  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useLeaveGuard(isDirty, setPendingHref);
  const requestLeave = useCallback(
    (href: string) => {
      if (isDirty) setPendingHref(href);
      else router.push(href);
    },
    [isDirty, router],
  );
  const leaveDialog = pendingHref ? (
    <UnsavedLeaveConfirm
      onStay={() => setPendingHref(null)}
      onLeave={() => {
        setPendingHref(null);
        router.push(pendingHref);
      }}
    />
  ) : null;

  return {
    status: lifecycleStatus(state, current, hasRow),
    isSaving: state.isSaving,
    lastSavedAt: state.lastSavedAt,
    isDirty,
    save,
    ensureSaved,
    saveError: state.saveError,
    conflict: state.conflict,
    reloadFromServer,
    clearError,
    resetBaseline,
    requestLeave,
    leaveDialog,
  };
}
