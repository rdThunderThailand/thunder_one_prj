import type { RegistrationOptions } from "../services/asset-registration-contract.ts";

type Category = RegistrationOptions["categories"][number];

function categoryAncestors(id: string, byId: Map<string, Category>): Category[] {
  const ancestors: Category[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);
  // Missing parents and cycles must not prevent choosing an otherwise active category.
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestors.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return ancestors;
}

export function registrationCategoryPath(id: string, categories: Category[]): string {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categoryAncestors(id, byId).map((category) => category.name).join(" › ");
}

export function registrationCategoryChoices(categories: Category[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories.map((category) => {
    const ancestors = categoryAncestors(category.id, byId);
    return {
      category,
      path: ancestors.map((ancestor) => ancestor.name).join(" › "),
      parentPath: ancestors.slice(0, -1).map((ancestor) => ancestor.name).join(" › "),
    };
  }).sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" })
    || a.category.id.localeCompare(b.category.id));
}
