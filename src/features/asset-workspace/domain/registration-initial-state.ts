import { referenceStatus } from "./registration-references.ts";
import type { RegistrationDraft } from "./registration-draft.ts";
import type { RegistrationOptions } from "../services/asset-registration-contract.ts";

export function registrationInitialStatus(draft: RegistrationDraft, options: RegistrationOptions): "Available" | "Assigned" {
  const kind = draft.custodyType === "person" ? "persons" : "orgUnits";
  const hasCustody = draft.custodyType !== "none" && Boolean(draft.custodyId) && referenceStatus(draft, options, kind) !== "unavailable";
  return hasCustody ? "Assigned" : "Available";
}

export function registrationInitialConditions(draft: RegistrationDraft, options: RegistrationOptions) {
  const status = registrationInitialStatus(draft, options);
  const conditions = options.initialConditionsByStatus?.[status] ?? options.initialConditions;
  // Older deployed options omit the status map. Damaged still requires valid initial custody.
  return conditions.filter((condition) => status === "Assigned" || condition !== "Damaged");
}
