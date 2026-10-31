import { useState } from "react";
import { newRegistrationState, type RegistrationDraft, type RegistrationState } from "../domain/registration-draft";
import { firstInvalidRegistrationStep, registrationErrors, type RegistrationErrors } from "../domain/registration-validation";
import { warrantyEndDate } from "../domain/registration-warranty-dates";
import { readRegistrationDraft, removeRegistrationDraft, saveRegistrationDraft } from "../services/asset-registration-draft-storage";
import type { RegistrationOptions } from "../services/asset-registration-contract";

export function useAssetRegistration(storageKey: string, options: RegistrationOptions) {
  const [initial] = useState(() => readRegistrationDraft(storageKey));
  const [state, setState] = useState<RegistrationState>(() => {
    const saved = initial.state;
    if (saved) {
      const invalid = firstInvalidRegistrationStep(saved.draft, options);
      return saved.step === 4 && invalid !== null ? { ...saved, step: invalid, editing: true } : saved;
    }
    const empty = newRegistrationState();
    empty.draft.tagMode = options.tagGeneration.modes.includes("automatic") ? "automatic" : "manual";
    empty.draft.condition = options.initialConditions[0];
    return empty;
  });
  const [errors, setErrors] = useState<RegistrationErrors>(() => initial.state ? registrationErrors(initial.state.draft, options, state.step) : {});
  const [storageUnavailable, setStorageUnavailable] = useState(initial.unavailable);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [discardFailed, setDiscardFailed] = useState(false);

  function changeCancelOpen(open: boolean) {
    setCancelOpen(open);
    if (!open) setDiscardFailed(false);
  }

  function commit(next: RegistrationState) {
    setStorageUnavailable(!saveRegistrationDraft(storageKey, next));
    setState(next);
  }

  function patch(changes: Partial<RegistrationDraft>) {
    const draft = { ...state.draft, ...changes };
    if (changes.custodyType !== undefined) draft.custodyId = "";
    if (changes.warrantyStart !== undefined || changes.warrantyYears !== undefined) {
      draft.warrantyEnd = warrantyEndDate(draft.warrantyStart, draft.warrantyYears);
    }
    commit({ ...state, draft });
    setErrors({});
  }

  function advance(): boolean {
    const invalid = state.editing || state.step === 3 ? firstInvalidRegistrationStep(state.draft, options) : null;
    const target = invalid ?? state.step;
    const found = registrationErrors(state.draft, options, target);
    setErrors(found);
    if (Object.keys(found).length) {
      if (target !== state.step) commit({ ...state, step: target });
      return false;
    }
    const nextStep = state.editing ? 4 : Math.min(state.step + 1, 4);
    commit({ ...state, step: nextStep, editing: false, reviewed: state.reviewed || nextStep === 4 });
    return true;
  }

  function edit(step: number) {
    commit({ ...state, step, editing: true, reviewed: true });
    setErrors({});
  }

  function back() {
    const step = Math.max(0, state.step - 1);
    commit({ ...state, step, editing: state.reviewed });
    setErrors({});
  }

  function discard(): boolean {
    const removed = removeRegistrationDraft(storageKey);
    setStorageUnavailable(!removed);
    setDiscardFailed(!removed);
    if (!removed) setCancelOpen(true);
    return removed;
  }

  const dirty = JSON.stringify(state.draft) !== JSON.stringify(newRegistrationState().draft);
  return { state, errors, storageUnavailable, cancelOpen, setCancelOpen: changeCancelOpen, discardFailed, dirty, patch, advance, edit, back, discard };
}
