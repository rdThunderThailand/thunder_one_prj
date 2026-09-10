import type { DraftFields } from "./store/usePublicationDraftStore";
// Explicit .ts extension so next-transition.check.mts can load this module
// under Node's ESM resolver, which does no extension guessing.
import { validateScheduleForm } from "./schedule.ts";
import { PUBLICATION_LIMITS } from "../../../config/limits.ts";
import { publicationTypes } from "./mock-data.ts";

// The five ver02 Create steps (ADR 0072 §2). 4 (Review) and 5 (Publish) carry no
// gate of their own — everything they show has already been validated by step 3.
export type WizardStepId = 1 | 2 | 3 | 4 | 5;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export type BasicInfoFieldId = "name" | "publicationType" | "description";

export type BasicInfoErrors = Partial<Record<BasicInfoFieldId, string>>;

export function validateBasicInfo(basicInfo: DraftFields["basicInfo"]): BasicInfoErrors {
  const errors: BasicInfoErrors = {};

  // Program name: required, and must not exceed the limit
  if (!basicInfo.name.trim()) {
    errors.name = "กรุณากรอกชื่อ Program";
  } else if (basicInfo.name.length > PUBLICATION_LIMITS.nameMaxLength) {
    errors.name = `ชื่อ Program ยาวเกิน ${PUBLICATION_LIMITS.nameMaxLength} ตัวอักษร`;
  }

  // Publication type must be one of the known types
  if (!publicationTypes.some((t) => t.id === basicInfo.publicationType)) {
    errors.publicationType = "กรุณาเลือกประเภทคอนเทนต์";
  }

  // Description over-limit (unchanged from today)
  if (basicInfo.description.length > PUBLICATION_LIMITS.descriptionMaxLength) {
    errors.description = `คำอธิบายยาวเกิน ${PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร`;
  }

  return errors;
}

function validateContentSelection(state: DraftFields): string[] {
  const errors: string[] = [];
  if (state.basicInfo.publicationType === "composition") {
    // Contract word is "composition"; the operator-facing error still says "Layout" (ADR 0052 §1).
    if (!state.compositionId) errors.push("กรุณาเลือก Layout");
  } else if (state.basicInfo.publicationType === "playlist") {
    if (!state.playlistId) errors.push("กรุณาเลือก Playlist");
  } else if (state.assetItems.length === 0) {
    errors.push("กรุณาเลือกสื่ออย่างน้อย 1 รายการ");
  }
  return errors;
}

export function validateStep(step: WizardStepId, state: DraftFields): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    errors.push(...validateContentSelection(state));
  } else if (step === 2) {
    errors.push(...Object.values(validateBasicInfo(state.basicInfo)));
  } else if (step === 3) {
    if (state.channelIds.length === 0) {
      errors.push("กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง");
    }
    errors.push(...Object.values(validateScheduleForm(state.scheduleForm)));
  }
  // steps 4 and 5: no gate.

  return {
    valid: errors.length === 0,
    errors,
  };
}
