import { z } from "zod";
import type { AssetCategory } from "./asset-category.ts";

export interface CategoryDraft {
  name: string;
  code: string;
  parentId: string;
  description: string;
  isSerialRequired: boolean;
}
export type CategoryField = keyof CategoryDraft;
export type CategoryFormErrors = Partial<Record<CategoryField, string>>;
export const emptyCategoryDraft: CategoryDraft = {
  name: "", code: "", parentId: "", description: "", isSerialRequired: false,
};
export const characterCount = (value: string) => Array.from(value).length;

const draftSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.")
    .refine((value) => characterCount(value) <= 255, "Use 255 characters or fewer."),
  code: z.string().trim().max(100, "Use 100 characters or fewer.")
    .regex(/^[a-zA-Z0-9_-]*$/, "Use letters, numbers, hyphens, or underscores."),
  parentId: z.union([z.literal(""), z.guid({ error: "Choose a valid parent category." })]),
  description: z.string().trim().refine((value) => characterCount(value) <= 500, "Use 500 characters or fewer."),
  isSerialRequired: z.boolean(),
}).strict();

export function validateCategoryDraft(draft: CategoryDraft) {
  const parsed = draftSchema.safeParse(draft);
  if (!parsed.success) {
    const fields: CategoryFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as CategoryField;
      if (key in emptyCategoryDraft && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false as const, fields };
  }
  const { name, code, parentId, description, isSerialRequired } = parsed.data;
  return { ok: true as const, input: {
    name, ...(code ? { code } : {}), parentId: parentId || null,
    description: description || null, isSerialRequired,
  } };
}
export type CategoryCreateInput = Extract<ReturnType<typeof validateCategoryDraft>, { ok: true }>["input"];

export function activeCategoryParents(categories: readonly AssetCategory[]) {
  return categories.filter((category) => category.status === "Active")
    .sort((left, right) => left.name.localeCompare(right.name, "en", { numeric: true, sensitivity: "base" }));
}

export function categoryCreateFeedback(status: number, code: string, details: unknown, uncertain: boolean) {
  const fields: CategoryFormErrors = {};
  let message = "The category could not be created. Your information has been kept.";
  if (uncertain) return { fields, message: "We couldn't confirm this was saved. Check the category list before creating it again." };
  if (code === "DUPLICATE_NAME") fields.name = "This name is already used in this organization.";
  else if (code === "DUPLICATE_CODE") fields.code = "This code is already used.";
  else if (code === "INVALID_PARENT" || code === "HIERARCHY_LOOP") fields.parentId = "That parent is no longer available. Choose another parent or Top level.";
  else if (code === "VALIDATION") {
    const direct = z.record(z.string(), z.array(z.string())).safeParse(details);
    const wrapped = z.object({ fieldErrors: z.record(z.string(), z.array(z.string())) }).safeParse(details);
    const errors = direct.success ? direct.data : wrapped.success ? wrapped.data.fieldErrors : {};
    const messages: Record<CategoryField, string> = {
      name: "Check the category name (required, up to 255 characters).",
      code: "Use up to 100 letters, numbers, hyphens, or underscores.",
      parentId: "Choose an available parent category or Top level.",
      description: "Use 500 characters or fewer.", isSerialRequired: "Choose Required or Optional.",
    };
    for (const key of Object.keys(messages) as CategoryField[]) {
      if (errors[key]?.length) fields[key] = messages[key];
    }
    message = "Review the category information and try again.";
  }
  if (status === 401 || code === "UNAUTHENTICATED") message = "Your session has expired. Sign in again; leaving this page may lose your input.";
  else if (status === 403 || code === "PERMISSION_DENIED") message = "You don't have permission, or your account or organization changed. Your information has been kept.";
  if (Object.keys(fields).length) message = "Review the highlighted fields.";
  return { fields, message };
}
