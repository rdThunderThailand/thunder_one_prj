import type { DraftFields } from "./store/usePublicationDraftStore";
// Explicit .ts extension so next-transition.check.mts can load this module
// under Node's ESM resolver, which does no extension guessing.
import { isScheduleFormValid } from "./schedule.ts";
import { PUBLICATION_LIMITS } from "../../config/limits.ts";

export type WizardStepId = 1 | 2 | 3 | 4;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep(
  step: WizardStepId,
  state: DraftFields
): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    if (!state.basicInfo.name.trim()) {
      errors.push("กรุณากรอกชื่อ Publication");
    }
    if (!state.basicInfo.campaignId.trim()) {
      errors.push("กรุณาเลือก Campaign");
    }
    if (state.basicInfo.description.length > PUBLICATION_LIMITS.descriptionMaxLength) {
      errors.push(`คำอธิบายยาวเกิน ${PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร`);
    }
  } else if (step === 2) {
    if (state.assetItems.length === 0) {
      errors.push("กรุณาเลือกสื่ออย่างน้อย 1 รายการ");
    }
  } else if (step === 3) {
    if (state.channelIds.length === 0) {
      errors.push("กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง");
    }
  } else if (step === 4) {
    if (!isScheduleFormValid(state.scheduleForm)) {
      errors.push("กำหนดการยังไม่ถูกต้อง");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
