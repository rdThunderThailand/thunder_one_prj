import { Textarea } from "@/components/ui/lovable/textarea";
import { Card } from "@/components/ui/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { AssetCategory } from "../../domain/asset-category";
import { characterCount, type CategoryField } from "../../domain/category-form";
import type { CategoryCreateFlow } from "../../hooks/use-category-create";
import { RegistrationField, RegistrationTextField } from "../register-asset/RegistrationFields";

export const categoryFieldTargets: Record<CategoryField, { id: string; label: string }> = {
  name: { id: "registration-category-name", label: "Category Name" },
  code: { id: "registration-category-code", label: "Category Code" },
  parentId: { id: "registration-category-parent", label: "Parent Category" },
  description: { id: "registration-category-description", label: "Description" },
  isSerialRequired: { id: "category-serial-optional", label: "Serial Number" },
};

export function CategoryInformation({ flow, parents }: { flow: CategoryCreateFlow; parents: AssetCategory[] }) {
  const { draft, fields, patch, blur } = flow;
  return (
    <Card role="region" aria-labelledby="category-information-title"
      className="space-y-3 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <h2 id="category-information-title" className="text-sm font-semibold text-foreground">Basic Information</h2>
      <fieldset disabled={flow.locked} className="min-w-0 space-y-4">
        <legend className="sr-only">Category information</legend>
        <div className="grid min-w-0 gap-4 @min-2xl/category-form:grid-cols-2">
          <RegistrationTextField
            name="category-name"
            label="Category Name"
            required
            value={draft.name}
            error={fields.name}
            hint="Use a clear name, up to 255 characters."
            placeholder="e.g. Computer"
            autoComplete="off"
            className="h-10"
            onChange={(event) => patch({ name: event.target.value })}
            onBlur={() => blur("name")}
          />
          <RegistrationTextField
            name="category-code"
            label="Category Code"
            value={draft.code}
            error={fields.code}
            hint="Leave blank to generate a CAT- code. Saved in uppercase; cannot be changed later."
            placeholder="e.g. LAP-01"
            autoComplete="off"
            spellCheck={false}
            className="h-10"
            onChange={(event) => patch({ code: event.target.value })}
            onBlur={() => blur("code")}
          />
        </div>
        <RegistrationField
          name="category-parent"
          label="Parent Category"
          hint="Optional. Only active categories can be selected."
          error={fields.parentId}
        >
          <Select value={draft.parentId || "top-level"} disabled={flow.locked}
            onValueChange={(value) => patch({ parentId: value === "top-level" ? "" : value })}>
            <SelectTrigger
              id={categoryFieldTargets.parentId.id}
              className="h-10 min-w-0"
              aria-invalid={Boolean(fields.parentId)}
              aria-describedby={`registration-category-parent-hint${fields.parentId ? " registration-category-parent-error" : ""}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-level">None (Top level)</SelectItem>
              {draft.parentId && !parents.some((parent) => parent.id === draft.parentId) && (
                <SelectItem value={draft.parentId} disabled>Selected parent — unavailable</SelectItem>
              )}
              {parents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id} className="wrap-anywhere">
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RegistrationField>
        <RegistrationField name="category-description" label="Description" error={fields.description}>
          <Textarea
            id={categoryFieldTargets.description.id}
            value={draft.description}
            rows={3}
            placeholder="Describe the assets that belong in this category."
            className="min-h-24 resize-y"
            aria-invalid={Boolean(fields.description)}
            aria-describedby={`category-description-count${fields.description ? " registration-category-description-error" : ""}`}
            onChange={(event) => patch({ description: event.target.value })}
            onBlur={() => blur("description")}
          />
          <p id="category-description-count" className="text-right text-xs tabular-nums text-muted-foreground">
            {characterCount(draft.description.trim())}/500 characters
          </p>
        </RegistrationField>
      </fieldset>
    </Card>
  );
}

export function CategoryRules({ flow }: { flow: CategoryCreateFlow }) {
  return (
    <Card role="region" aria-labelledby="category-rules-title"
      className="space-y-3 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <h2 id="category-rules-title" className="text-sm font-semibold text-foreground">Category Rules</h2>
      <fieldset disabled={flow.locked} aria-describedby={flow.fields.isSerialRequired ? "category-serial-error" : undefined}>
        <legend className="mb-3 text-xs font-medium text-foreground">Serial Number</legend>
        <div className="grid gap-3 @min-2xl/category-form:grid-cols-2">
          {[
            { value: false, label: "Optional", hint: "Assets may be registered without a serial number." },
            { value: true, label: "Required", hint: "Assets must have a serial number when registered." },
          ].map((option) => (
            <label
              key={option.label}
              className={`flex cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors motion-reduce:transition-none ${flow.draft.isSerialRequired === option.value ? "border-primary bg-accent" : "border-border hover:bg-muted"} ${flow.locked ? "cursor-default opacity-60" : ""}`}
            >
              <input
                id={`category-serial-${option.label.toLowerCase()}`}
                type="radio"
                name="category-serial"
                checked={flow.draft.isSerialRequired === option.value}
                className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring"
                onChange={() => flow.patch({ isSerialRequired: option.value })}
              />
              <span className="min-w-0 space-y-1">
                <span className="block text-xs font-semibold text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {flow.fields.isSerialRequired && (
          <p id="category-serial-error" role="alert" className="mt-2 text-xs text-error">{flow.fields.isSerialRequired}</p>
        )}
      </fieldset>
    </Card>
  );
}
