"use client";

// The bridge between the editor's draft and save-composition.ts: `write` is the adapter
// `useEditorLifecycle` calls (ADR 0127), `run` carries the editor's other writes with their
// own in-flight flag and error slot.
//
// Paired with save-composition.ts by ticket 25 so ticket 28 has both halves of the save path
// in files of its own.

import { useState } from "react";
import { toast } from "sonner";
import { classifyApiError } from "@/lib/api/api-error";
import type { CompositionDraftFields } from "../load-composition-draft";
import { persistComposition, type PersistInput, type PersistResult } from "../save-composition";

/** What the editor compares against its baseline: the draft fields, plus whether geometry edits are pending. */
export type CompositionSnapshot = { draft: CompositionDraftFields; pendingGeometry: boolean };

/** `persistComposition` rewrites `layoutId` and `bindings` while it saves (idempotency keys, inline Playlist
 *  ids, a created Layout), so the saved baseline is built from its result, not from the start (#454, ADR 0127 §3). */
export function savedCompositionSnapshot(start: CompositionSnapshot, result: PersistResult): CompositionSnapshot {
  return { draft: { ...start.draft, layoutId: result.layoutId, bindings: result.bindings }, pendingGeometry: false };
}

export function useCompositionSave(buildInput: () => PersistInput, applyResult: (result: PersistResult) => void) {
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  /** The editor's writes other than Save (fork Layout, Save as Template, activation), sharing one in-flight flag and one error slot. */
  const run = async (operation: () => Promise<void>, fallback: string) => {
    setRunError(null);
    setBusy(true);
    try {
      await operation();
    } catch (err) {
      setRunError(classifyApiError(err, fallback).message);
    } finally {
      setBusy(false);
    }
  };

  // Deliberately ignores the lifecycle's `snapshot` argument: it saves the latest render through `buildInput`, so
  // `lifecycle.save` must not be given an override snapshot here (ADR 0127 §2). Starting a save clears a stale `run` error.
  const write = async (): Promise<PersistResult> => {
    setRunError(null);
    const result = await persistComposition(buildInput());
    applyResult(result);
    // The core save succeeded — `applyResult` has marked the editor saved. A filing step
    // (folder move, tags) that failed rides in `warnings`: a toast survives the navigation
    // the caller may do, where the header's error slot would not.
    if (result.warnings.length > 0) toast.warning(result.warnings.join(" · "));
    return result;
  };

  return { write, run, busy, runError };
}
