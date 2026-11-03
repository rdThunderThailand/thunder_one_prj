import type { RegistrationDraft } from "./registration-draft.ts";
import type { RegistrationOptions } from "../services/asset-registration-contract.ts";
import { referenceLabel, type SelectorKind } from "../services/registration-selector-contract.ts";

export function referenceId(draft: RegistrationDraft, kind: SelectorKind) {
  if (kind === "categories") return draft.categoryId.toLowerCase();
  if (kind === "locations") return draft.locationId.toLowerCase();
  return draft.custodyType === (kind === "persons" ? "person" : "org_unit") ? draft.custodyId.toLowerCase() : "";
}
export function selectedReference(draft: RegistrationDraft, kind: SelectorKind) {
  const item = draft.selectedReferences[kind];
  return item?.id === referenceId(draft, kind) ? item : null;
}
export function referenceStatus(draft: RegistrationDraft, options: RegistrationOptions, kind: SelectorKind) {
  const state = options.referenceValidation?.[kind];
  return state?.id === referenceId(draft, kind) ? state.status : "pending";
}
export function selectedReferenceLabel(draft: RegistrationDraft, kind: SelectorKind) {
  const item = selectedReference(draft, kind);
  return item ? referenceLabel(item, kind) : referenceId(draft, kind) ? `Saved selection · ${referenceId(draft, kind)}` : "";
}
export function referenceValidationMessage(draft: RegistrationDraft, options: RegistrationOptions, kind: SelectorKind) {
  if (!referenceId(draft, kind)) return "Choose a reference.";
  const state = options.referenceValidation?.[kind];
  if (state?.id === referenceId(draft, kind) && state.status === "valid") return undefined;
  return state?.id === referenceId(draft, kind) && state.message ? state.message : "This saved selection is pending validation. Check it before continuing.";
}
