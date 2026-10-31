import { useState } from "react";
import { newRegistrationState, type RegistrationDraft, type RegistrationState } from "../domain/registration-draft";
import { firstInvalidRegistrationStep, registrationErrors, type RegistrationErrors } from "../domain/registration-validation";
import { registrationInitialConditions } from "../domain/registration-initial-state";
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
    empty.draft.condition = registrationInitialConditions(empty.draft, options)[0] ?? "Good";
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
    commit({ ...state, draft });
    setErrors({});
  }

  function advance(): boolean {
    const conditionInvalid = state.step >= 2 && registrationErrors(state.draft, options, 0).condition;
    let invalid: number | null = null;
    if (conditionInvalid) invalid = 0;
    else if (state.editing || state.step === 3) invalid = firstInvalidRegistrationStep(state.draft, options);
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
    if (!Number.isInteger(step) || step < 0 || step >= 4) return;
    if (!state.reviewed && step >= state.step) return;
    // Early edits keep normal Next navigation; Update is reserved for returning from Review.
    commit({ ...state, step, editing: state.reviewed });
    setErrors({});
  }

  function back() {
    const step = Math.max(0, state.step - 1);
    commit({ ...state, step, editing: state.reviewed });
    setErrors({});
  }

  function validateForConfirmation(step: number) {
    commit({ ...state, step, editing: true, reviewed: true });
    setErrors(registrationErrors(state.draft, options, step));
  }

  function discard(): boolean {
    const removed = removeRegistrationDraft(storageKey);
    setStorageUnavailable(!removed);
    setDiscardFailed(!removed);
    if (!removed) setCancelOpen(true);
    return removed;
  }

  const dirty = JSON.stringify(state.draft) !== JSON.stringify(newRegistrationState().draft);
  return { state, errors, storageUnavailable, cancelOpen, setCancelOpen: changeCancelOpen, discardFailed, dirty, patch, advance, edit, back, discard, validateForConfirmation };
}
