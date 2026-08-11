// Per-step gate for the Create Playlist wizard, same shape as the publications one
// (docs/adr/0001-wizard-step-contract.md) minus the persistence half: a playlist draft
// never touches the network before the final submit, so `Next` is validate → setStep.

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
  /** Names already taken in this tenant, excluding the playlist being edited.
   *  `media_core.playlists` has UNIQUE (tenant_id, name) and the RPC surfaces the
   *  violation as an opaque 500, so the collision has to be caught here. */
  takenNames?: string[];
}

/** Postgres compares the UNIQUE index byte-for-byte, but "Test" vs "test" is a collision
 *  a human would not expect to be allowed either — warn on both. */
export function isNameTaken(name: string, takenNames: string[] = []): boolean {
  const needle = name.trim().toLowerCase();
  return takenNames.some((taken) => taken.trim().toLowerCase() === needle);
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
    } else if (isNameTaken(trimmed, draft.takenNames)) {
      errors.push("มี playlist ชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
    }
    if ((draft.description?.length ?? 0) > PLAYLIST_LIMITS.descriptionMax) {
      errors.push(`คำอธิบายยาวเกิน ${PLAYLIST_LIMITS.descriptionMax} ตัวอักษร`);
    }
  }

  if (step === 2 && draft.items.length === 0) {
    errors.push("เลือก media อย่างน้อย 1 ชิ้น");
  }

  // Step 3 is playback settings — every control has a default, so nothing can be missing.

  return { valid: errors.length === 0, errors };
}

/** Whether the wizard can be submitted at all — every step's rules at once. */
export function canSubmit(draft: ValidatableDraft): boolean {
  return ([1, 2, 3] as WizardStepId[]).every((step) => validateStep(step, draft).valid);
}
