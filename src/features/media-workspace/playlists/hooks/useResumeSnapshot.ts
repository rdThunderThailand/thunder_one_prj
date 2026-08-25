"use client";

import { useRef } from "react";
import { hasDraftContent, type PlaylistDraftFields } from "../store/usePlaylistDraftStore";

/** Captures once, on the first render after the store rehydrates, whether the draft had
 *  content and/or an `editingId`. Anything the operator does afterwards must not change
 *  the answer — reading live state is what made the resume prompt fire on the first
 *  keystroke of a brand-new playlist (docs/adr/0014). */
/* eslint-disable react-hooks/refs -- intentional: this hook's entire job is reading a ref
   snapshot captured once at hydration, same pattern the inline version used before
   extraction. */
export function useResumeSnapshot(hydrated: boolean, draft: PlaylistDraftFields) {
  const hadContentAtHydrationRef = useRef<boolean | null>(null);
  if (hydrated && hadContentAtHydrationRef.current === null) {
    hadContentAtHydrationRef.current = hasDraftContent(draft);
  }

  const hadEditingIdAtHydrationRef = useRef<boolean | null>(null);
  if (hydrated && hadEditingIdAtHydrationRef.current === null) {
    hadEditingIdAtHydrationRef.current = Boolean(draft.editingId);
  }

  return {
    hadContentAtHydration: hadContentAtHydrationRef.current ?? false,
    hadEditingIdAtHydration: hadEditingIdAtHydrationRef.current ?? false,
  };
}
/* eslint-enable react-hooks/refs */
