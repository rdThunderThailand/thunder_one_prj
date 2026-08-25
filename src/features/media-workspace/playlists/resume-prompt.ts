/** Whether to ask "carry on or start fresh?" when the wizard opens.
 *
 *  Deliberately blind to the draft's *current* contents: it takes only what was true when
 *  the store rehydrated. Reading live state is what made the prompt fire on the first
 *  keystroke of a brand-new playlist (docs/adr/0014). */
export function shouldShowResumePrompt(input: {
  hadContentAtHydration: boolean;
  isEditMode: boolean;
  dismissed: boolean;
}): boolean {
  return input.hadContentAtHydration && !input.isEditMode && !input.dismissed;
}
