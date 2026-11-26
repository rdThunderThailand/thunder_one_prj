import type { ReferenceItem } from "../services/registration-selector-contract.ts";
import { referenceLabel } from "../services/registration-selector-contract.ts";

export function registrationCategoryPath(id: string, category: ReferenceItem | null): string {
  return category?.id === id.toLowerCase() ? referenceLabel(category, "categories") : id ? `Saved category · ${id}` : "";
}
