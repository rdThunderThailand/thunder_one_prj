export type ResumePromptKind = "draft" | "editing" | null;

/** Which "carry on or start fresh?" prompt to show when the wizard opens, if any.
 *
 *  Deliberately blind to the draft's *current* contents: it takes only what was true when
 *  the store rehydrated. Reading live state is what made the prompt fire on the first
 *  keystroke of a brand-new playlist (docs/adr/0014).
 *
 *  Two distinct stale states get two distinct messages:
 *  - "editing": the draft is tied to a specific playlist (`editingId` was already set at
 *    hydration) — e.g. the operator edited playlist X, left mid-wizard, and came back via
 *    the bare "+ Create Playlist" button. Silently resuming would show "Save Changes" for
 *    a playlist the operator never asked to reopen.
 *  - "draft": there's unsaved new-playlist content but no `editingId` tie.
 */
export function resumePromptKind(input: {
  hadContentAtHydration: boolean;
  hadEditingIdAtHydration: boolean;
  isUrlEditMode: boolean;
  dismissed: boolean;
}): ResumePromptKind {
  if (input.isUrlEditMode || input.dismissed) return null;
  if (input.hadEditingIdAtHydration) return "editing";
  if (input.hadContentAtHydration) return "draft";
  return null;
}
