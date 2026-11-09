import { newRegistrationState, type RegistrationState } from "./registration-draft.ts";
import { registrationInitialConditions } from "./registration-initial-state.ts";
import type { RegistrationOptions } from "../services/asset-registration-contract.ts";
import type { ReferenceItem } from "../services/registration-selector-contract.ts";

/** Saved work always wins; a category link supplies defaults only to a fresh draft. */
export function initialRegistrationState(saved: RegistrationState | null, options: RegistrationOptions, category?: ReferenceItem) {
  if (saved) return saved;
  const state = newRegistrationState();
  state.draft.tagMode = options.tagGeneration.modes.includes("automatic") ? "automatic" : "manual";
  state.draft.condition = registrationInitialConditions(state.draft, options)[0] ?? "Good";
  if (category) {
    state.draft.categoryId = category.id;
    state.draft.selectedReferences.categories = { ...category };
  }
  return state;
}

export function needsCategoryDraftChoice(prefill: ReferenceItem | undefined, draftCategory: string,
  hasSavedWork: boolean, locked: boolean) {
  return Boolean(prefill && hasSavedWork && prefill.id !== draftCategory && !locked);
}
