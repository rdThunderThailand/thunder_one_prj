import type { DraftFields } from "./store/usePublicationDraftStore.ts";

/** Did the operator actually put anything into this draft? */
export function hasDraftContent(
  d: Pick<DraftFields, "basicInfo" | "assetItems" | "playlistId" | "channelIds" | "step">
): boolean {
  // Deliberately blind to scheduleForm: makeDefaultScheduleForm() embeds the
  // current date/time, so it would make every draft look non-empty (docs/adr/0014).
  return Boolean(
    d.basicInfo.name.trim() ||
      d.basicInfo.campaignId ||
      d.basicInfo.description.trim() ||
      d.basicInfo.tags.length ||
      d.assetItems.length ||
      d.playlistId ||
      d.channelIds.length ||
      d.step > 1
  );
}

/** Whether to ask "carry on or start fresh?" when the wizard opens.
 *
 *  Deliberately blind to the draft's *current* contents: it takes only what was true when
 *  the store rehydrated. Reading live state is what made the prompt fire on the first
 *  keystroke of a brand-new publication (docs/adr/0014). */
export function shouldShowResumePrompt(input: {
  hadContentAtHydration: boolean;
  isEditMode: boolean;
  dismissed: boolean;
}): boolean {
  return input.hadContentAtHydration && !input.isEditMode && !input.dismissed;
}
