import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/lovable/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { AssetCategory, AssetCategoryDetail } from "../../domain/asset-category";
import { categoryEditParents } from "../../domain/category-edit";
import { characterCount } from "../../domain/category-form";
import type { useCategoryEdit } from "../../hooks/use-category-edit";
import { RegistrationField, RegistrationTextField } from "../register-asset/RegistrationFields";

export function CategoryEditFields({ category, flow, categories, parentsPending }: {
  category: AssetCategoryDetail;
  flow: ReturnType<typeof useCategoryEdit>;
  categories: AssetCategory[];
  parentsPending: boolean;
}) {
  const { draft, fields, patch } = flow;
  const parents = categoryEditParents(categories, category, draft.parentId);
  return (
    <Card role="region" aria-labelledby="category-edit-information-title"
      className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <h2 id="category-edit-information-title" className="text-sm font-semibold">Category Information</h2>
      <fieldset disabled={flow.locked} className="min-w-0 space-y-4">
        <legend className="sr-only">Category information</legend>
        <RegistrationTextField name="category-name" label="Category Name" required value={draft.name}
          error={fields.name} autoComplete="off" className="h-10"
          onChange={(event) => patch({ name: event.target.value })} />
        <RegistrationField name="category-parent" label="Parent Category" error={fields.parentId}
          hint="Choose an active category. This category and its descendants are excluded.">
          <Select value={draft.parentId || "top-level"} disabled={flow.locked || parentsPending}
            onValueChange={(value) => patch({ parentId: value === "top-level" ? "" : value })}>
            <SelectTrigger id="registration-category-parent" className="h-10 min-w-0"
              aria-invalid={Boolean(fields.parentId)}
              aria-describedby={`registration-category-parent-hint${fields.parentId ? " registration-category-parent-error" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-level">None (Top level)</SelectItem>
              {draft.parentId && !parents.some((parent) => parent.id === draft.parentId) && (
                <SelectItem value={draft.parentId} disabled>
                  {category.parent?.id === draft.parentId ? category.parent.name : "Selected parent"} — unavailable
                </SelectItem>
              )}
              {parents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id} disabled={parent.status === "Inactive"} className="wrap-anywhere">
                  {parent.name}{parent.status === "Inactive" ? " (Inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RegistrationField>
        <RegistrationField name="category-description" label="Description" error={fields.description}>
          <Textarea id="registration-category-description" value={draft.description} rows={4}
            className="min-h-24 resize-y" aria-invalid={Boolean(fields.description)}
            aria-describedby={`category-edit-description-count${fields.description ? " registration-category-description-error" : ""}`}
            onChange={(event) => patch({ description: event.target.value })} />
          <p id="category-edit-description-count" className="text-right text-xs tabular-nums text-muted-foreground">
            {characterCount(draft.description.trim())}/500
          </p>
        </RegistrationField>
      </fieldset>
    </Card>
  );
}
