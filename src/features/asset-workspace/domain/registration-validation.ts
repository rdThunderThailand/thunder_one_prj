import type { RegistrationOptions } from "../services/asset-registration-contract.ts";
import type { RegistrationDraft } from "./registration-draft.ts";
import { isCalendarDate, warrantyEndDate } from "./registration-warranty-dates.ts";

export type RegistrationErrors = Partial<Record<keyof RegistrationDraft, string>>;

export function registrationErrors(draft: RegistrationDraft, options: RegistrationOptions, step: number): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (step === 0) {
    if (!draft.name.trim()) errors.name = "Enter an asset name.";
    if (!options.tagGeneration.modes.includes(draft.tagMode)) errors.tagMode = "Choose an available Asset Tag mode.";
    if (draft.tagMode === "manual" && !draft.assetCode.trim()) errors.assetCode = "Enter an Asset Tag or choose automatic generation.";
    if (!options.initialConditions.includes(draft.condition)) errors.condition = "Choose an available initial condition.";
  }
  if (step === 1) {
    const category = options.categories.find((item) => item.id === draft.categoryId);
    if (!category) errors.categoryId = "Choose an active category.";
    if (category?.is_serial_required && !draft.serialNumber.trim()) errors.serialNumber = "This category requires a serial number.";
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
    if (draft.warrantyEnabled) {
      if (!draft.warrantyProvider.trim()) errors.warrantyProvider = "Enter the warranty provider, or turn off Include warranty.";
      if (draft.warrantyStart && !isCalendarDate(draft.warrantyStart)) errors.warrantyStart = "Enter a valid warranty start date.";
      if (draft.warrantyYears && !warrantyEndDate(draft.warrantyStart, draft.warrantyYears)) {
        errors.warrantyYears = "Enter a valid start date and a whole number of years within the supported calendar range.";
      }
      if (draft.warrantyEnd !== warrantyEndDate(draft.warrantyStart, draft.warrantyYears)) {
        errors.warrantyEnd = "Re-enter the warranty start date or period to recalculate its end date.";
      }
      if (draft.warrantyEnd && (!isCalendarDate(draft.warrantyEnd) || (draft.warrantyStart && draft.warrantyEnd < draft.warrantyStart))) {
        errors.warrantyEnd = "Warranty end must be on or after the start date.";
      }
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
    parts.unshift(current.name || current.id);
    current = options.locations.find((item) => item.id === current?.parent_location_id);
  }
  return parts.join(" › ");
}
