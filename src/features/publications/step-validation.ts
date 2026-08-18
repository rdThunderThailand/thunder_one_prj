import type { DraftFields } from "./store/usePublicationDraftStore";
// Explicit .ts extension so next-transition.check.mts can load this module
// under Node's ESM resolver, which does no extension guessing.
import { validateScheduleForm } from "./schedule.ts";
import { PUBLICATION_LIMITS } from "../../config/limits.ts";
import { publicationTypes } from "./mock-data.ts";

export type WizardStepId = 1 | 2 | 3 | 4;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export type BasicInfoFieldId = "campaignId" | "name" | "publicationType" | "description";

export interface Step1Context {
  /** Ids of the campaigns actually loaded from the API. Omit to skip the availability check. */
  campaignIds?: string[];
}

export type BasicInfoErrors = Partial<Record<BasicInfoFieldId, string>>;

export function validateBasicInfo(
  basicInfo: DraftFields["basicInfo"],
  ctx?: Step1Context
): BasicInfoErrors {
  const errors: BasicInfoErrors = {};

  // Campaign: required, and if provided must still exist in the loaded list
  if (!basicInfo.campaignId.trim()) {
    errors.campaignId = "กรุณาเลือก Campaign";
  } else if (ctx?.campaignIds !== undefined && !ctx.campaignIds.includes(basicInfo.campaignId)) {
    errors.campaignId = "Campaign ที่เลือกไว้ไม่มีอยู่แล้ว กรุณาเลือกใหม่";
  }

  // Publication name: required, and must not exceed the limit
  if (!basicInfo.name.trim()) {
    errors.name = "กรุณากรอกชื่อ Publication";
  } else if (basicInfo.name.length > PUBLICATION_LIMITS.nameMaxLength) {
    errors.name = `ชื่อ Publication ยาวเกิน ${PUBLICATION_LIMITS.nameMaxLength} ตัวอักษร`;
  }

  // Publication type must be one of the known types
  if (!publicationTypes.some((t) => t.id === basicInfo.publicationType)) {
    errors.publicationType = "กรุณาเลือกประเภท Publication";
  }

  // Description over-limit (unchanged from today)
  if (basicInfo.description.length > PUBLICATION_LIMITS.descriptionMaxLength) {
    errors.description = `คำอธิบายยาวเกิน ${PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร`;
  }

  return errors;
}

export function validateStep(
  step: WizardStepId,
  state: DraftFields,
  ctx?: Step1Context
): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    errors.push(...Object.values(validateBasicInfo(state.basicInfo, ctx)));
  } else if (step === 2) {
    if (state.basicInfo.publicationType === "playlist") {
      if (!state.playlistId) {
        errors.push("กรุณาเลือก Playlist");
      }
    } else {
      if (state.assetItems.length === 0) {
        errors.push("กรุณาเลือกสื่ออย่างน้อย 1 รายการ");
      }
    }
  } else if (step === 3) {
    if (state.channelIds.length === 0) {
      errors.push("กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง");
    }
  } else if (step === 4) {
    errors.push(...Object.values(validateScheduleForm(state.scheduleForm)));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
