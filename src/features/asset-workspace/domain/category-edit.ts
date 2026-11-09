import type { AssetCategory, AssetCategoryDetail } from "./asset-category.ts";
import { validateCategoryDraft, type CategoryDraft } from "./category-form.ts";

export function categoryEditDraft(category: AssetCategoryDetail): CategoryDraft {
  return { name: category.name, code: "", parentId: category.parentId ?? "",
    description: category.description ?? "", isSerialRequired: category.isSerialRequired };
}

export function categoryEditPatch(category: AssetCategoryDetail, draft: CategoryDraft) {
  const validated = validateCategoryDraft({ ...draft, code: "" });
  if (!validated.ok) return validated;
  const input = validated.input;
  const changes: { name?: string; parentId?: string | null; description?: string | null; isSerialRequired?: boolean } = {};
  if (input.name !== category.name.trim()) changes.name = input.name;
  if (input.parentId !== category.parentId) changes.parentId = input.parentId;
  if (input.description !== (category.description?.trim() || null)) changes.description = input.description;
  if (input.isSerialRequired !== category.isSerialRequired) changes.isSerialRequired = input.isSerialRequired;
  return { ok: true as const, dirty: Object.keys(changes).length > 0,
    input: { expectedUpdatedAt: category.updatedAt, ...changes } };
}
export type CategoryEditInput = Extract<ReturnType<typeof categoryEditPatch>, { ok: true }>["input"];

export function categoryEditParents(categories: AssetCategory[], category: AssetCategoryDetail, selected: string) {
  const excluded = new Set([category.id]);
  const children = new Map<string, string[]>();
  for (const row of categories) {
    if (row.parentId) {
      const direct = children.get(row.parentId) ?? [];
      direct.push(row.id);
      children.set(row.parentId, direct);
    }
  }
  const queue = [category.id];
  for (let index = 0; index < queue.length; index++) {
    for (const id of children.get(queue[index]) ?? []) {
      if (!excluded.has(id)) { excluded.add(id); queue.push(id); }
    }
  }
  const options = categories.filter((row) => !excluded.has(row.id)
    && (row.status === "Active" || (row.id === category.parentId && row.id === selected)));
  return options.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }));
}
