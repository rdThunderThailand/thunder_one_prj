import type { RegistrationDraft } from "./registration-draft.ts";
import { selectedReferenceLabel } from "./registration-references.ts";

export function registrationCustodyLabel(draft: RegistrationDraft): string {
  if (draft.custodyType === "none") return "Unassigned";
  return selectedReferenceLabel(draft, draft.custodyType === "person" ? "persons" : "orgUnits") || "Choose a custody target";
}
