import type { RegistrationDraft } from "./registration-draft.ts";
import type { RegistrationOptions } from "../services/asset-registration-contract.ts";

export function registrationInitialStatus(draft: RegistrationDraft, options: RegistrationOptions): "Available" | "Assigned" {
  const targets = draft.custodyType === "person" ? options.persons : options.orgUnits;
  const hasCustody = draft.custodyType !== "none" && targets.some((target) => target.id === draft.custodyId);
  return hasCustody ? "Assigned" : "Available";
}

export function registrationInitialConditions(draft: RegistrationDraft, options: RegistrationOptions) {
  const status = registrationInitialStatus(draft, options);
  const conditions = options.initialConditionsByStatus?.[status] ?? options.initialConditions;
  // Older deployed options omit the status map. Damaged still requires valid initial custody.
  return conditions.filter((condition) => status === "Assigned" || condition !== "Damaged");
}
