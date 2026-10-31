import type { RegistrationOptions } from "../services/asset-registration-contract.ts";
import type { RegistrationDraft } from "./registration-draft.ts";
import { isCalendarDate } from "./registration-warranty-dates.ts";
import { warrantyErrors } from "./registration-warranties.ts";
import { registrationInitialConditions } from "./registration-initial-state.ts";

export type RegistrationErrors = Partial<Record<keyof RegistrationDraft, string>>;

export function registrationErrors(draft: RegistrationDraft, options: RegistrationOptions, step: number): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (step === 0) {
    if (!draft.name.trim()) errors.name = "Enter an asset name.";
    if (draft.name.trim().length > 250) errors.name = "Use no more than 250 characters.";
    if (draft.description.length > 5000) errors.description = "Use no more than 5000 characters.";
    if (!options.tagGeneration.modes.includes(draft.tagMode)) errors.tagMode = "Choose an available Asset Tag mode.";
    if (draft.tagMode === "manual" && !draft.assetCode.trim()) errors.assetCode = "Enter an Asset Tag or choose automatic generation.";
    if (draft.tagMode === "manual" && draft.assetCode.trim().length > 100) errors.assetCode = "Use no more than 100 characters.";
    if (!registrationInitialConditions(draft, options).includes(draft.condition)) {
      errors.condition = "Choose a condition allowed for the current status. Damaged requires valid initial custody in Step 3.";
    }
  }
  if (step === 1) {
    const category = options.categories.find((item) => item.id === draft.categoryId);
    if (!category) errors.categoryId = "Choose an active category.";
    if (category?.is_serial_required && !draft.serialNumber.trim()) errors.serialNumber = "This category requires a serial number.";
    if (draft.serialNumber.trim().length > 250) errors.serialNumber = "Use no more than 250 characters.";
  }
  if (step === 2) {
    if (!options.locations.some((item) => item.id === draft.locationId)) errors.locationId = "Choose an active location.";
    const targets = draft.custodyType === "person" ? options.persons : options.orgUnits;
    if (draft.custodyType !== "none" && !targets.some((item) => item.id === draft.custodyId)) {
      errors.custodyId = "Choose an active custody target.";
    }
  }
  if (step === 3) {
    if (draft.purchaseDate && !isCalendarDate(draft.purchaseDate)) errors.purchaseDate = "Enter a valid acquisition date.";
    if (draft.warranties.some((warranty) => Object.keys(warrantyErrors(warranty)).length)) errors.warranties = "Check the highlighted warranty fields.";
    if (draft.warranties.length && draft.warranties.filter((warranty) => warranty.isCurrent).length !== 1) {
      errors.warranties = "Choose exactly one Current warranty and check any highlighted fields.";
    }
  }
  return errors;
}

export function firstInvalidRegistrationStep(draft: RegistrationDraft, options: RegistrationOptions): number | null {
  for (let step = 0; step < 4; step++) {
    if (Object.keys(registrationErrors(draft, options, step)).length) return step;
  }
  return null;
}

export function locationPath(id: string, options: RegistrationOptions): string {
  const parts: string[] = [];
  const visited = new Set<string>();
  let current = options.locations.find((item) => item.id === id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name?.trim() || "Unnamed location");
    current = options.locations.find((item) => item.id === current?.parent_location_id);
  }
  return parts.join(" › ");
}
