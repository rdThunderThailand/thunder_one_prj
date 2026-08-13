// Per-step gate for the Create Playlist wizard, same shape as the publications one
// (docs/adr/0001-wizard-step-contract.md) minus the persistence half — Next still just
// validates then calls setStep; the actual draft-row save now happens in
// CreatePlaylistPage's goNext handler (docs/adr/0012-playlist-draft-save.md).

import type { DraftItem } from "./types";

export const PLAYLIST_LIMITS = {
  nameMax: 100,
  descriptionMax: 300,
} as const;

export type WizardStepId = 1 | 2 | 3;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidatableDraft {
  name: string;
  description?: string;
  items: DraftItem[];
}

export function validateStep(
  step: WizardStepId,
  draft: ValidatableDraft
): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    const trimmed = draft.name.trim();
    if (trimmed.length === 0) {
      errors.push("ตั้งชื่อ playlist ก่อน");
    } else if (trimmed.length > PLAYLIST_LIMITS.nameMax) {
      errors.push(`ชื่อยาวเกิน ${PLAYLIST_LIMITS.nameMax} ตัวอักษร`);
    }
    if ((draft.description?.length ?? 0) > PLAYLIST_LIMITS.descriptionMax) {
      errors.push(`คำอธิบายยาวเกิน ${PLAYLIST_LIMITS.descriptionMax} ตัวอักษร`);
    }
  }

  if (step === 2 && draft.items.length === 0) {
    errors.push("เลือก media อย่างน้อย 1 ชิ้น");
  }

  return { valid: errors.length === 0, errors };
}

/** Whether the wizard can be submitted at all — every step's rules at once. */
export function canSubmit(draft: ValidatableDraft): boolean {
  return ([1, 2, 3] as WizardStepId[]).every((step) => validateStep(step, draft).valid);
}
