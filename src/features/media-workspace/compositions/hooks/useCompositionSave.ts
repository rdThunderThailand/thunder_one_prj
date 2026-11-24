"use client";

// The bridge between the editor's draft and save-composition.ts: holds the in-flight and
// error state, calls the write sequence, and folds the result back into the draft.
//
// Paired with save-composition.ts by ticket 25 so ticket 28 has both halves of the save path
// in files of its own.

import { useState } from "react";
import { toast } from "sonner";
import { classifyApiError } from "@/lib/api/api-error";
import { describeActivateError } from "../status-display";
import { persistComposition, type PersistInput, type PersistResult } from "../save-composition";

export function useCompositionSave(buildInput: () => PersistInput, applyResult: (result: PersistResult) => void) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Any write the editor makes, sharing one in-flight flag and one error slot. */
  const run = async (operation: () => Promise<void>, fallback: string) => {
    setSaveError(null);
    setSaving(true);
    try {
      await operation();
    } catch (err) {
      // set_zones raises the same "zone(s) … are unbound" wording as activation once the
      // Composition is active (ADR 0049 §10), so describeActivateError covers both paths.
      const message = err instanceof Error ? err.message : "";
      setSaveError(message.startsWith("Invalid input:") || message.startsWith("Already")
        ? describeActivateError(message)
        : classifyApiError(err, fallback).message);
    } finally {
      setSaving(false);
    }
  };

  const save = (after: (result: PersistResult) => Promise<void> | void, fallback: string) =>
    run(async () => {
      const result = await persistComposition(buildInput());
      applyResult(result);
      // The core save succeeded — `applyResult` has marked the editor saved. A filing step
      // (folder move, tags) that failed rides in `warnings`: a toast survives the navigation
      // `after` may do, where the header's error slot would not.
      if (result.warnings.length > 0) toast.warning(result.warnings.join(" · "));
      await after(result);
    }, fallback);

  return { save, run, saving, saveError };
}
