import { useState } from "react";
import { CategoryIcon, CheckIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/lovable/input";
import { RegistrationSection, RegistrationTextField, UnavailableRegistrationFields, type RegistrationStepProps } from "./RegistrationFields";

export function CategorySpecificationStep({ draft, options, errors, patch }: RegistrationStepProps) {
  const [search, setSearch] = useState("");
  const categories = options.categories.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const selected = options.categories.find((item) => item.id === draft.categoryId);

  return (
    <div className="space-y-3">
      <RegistrationSection title="Category" description="Select the category that best fits this asset.">
        <label htmlFor="registration-category-search" className="sr-only">Search categories</label>
        <Input id="registration-category-search" placeholder="Search categories…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <fieldset id="registration-categoryId" tabIndex={-1} aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? "registration-categoryId-error" : undefined}>
          <legend className="sr-only">Category (required)</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {categories.map((category) => (
              <label key={category.id} className={`relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-control border p-3 text-center text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${draft.categoryId === category.id ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-muted"}`}>
                <input type="radio" name="asset-category" value={category.id} checked={draft.categoryId === category.id} onChange={() => patch({ categoryId: category.id })} className="sr-only" />
                <CategoryIcon className="h-5 w-5" />
                <span className="break-words">{category.name}</span>
                {draft.categoryId === category.id && <CheckIcon className="absolute right-2 top-2 h-3.5 w-3.5" />}
              </label>
            ))}
          </div>
          {categories.length === 0 && <p className="py-4 text-xs text-muted-foreground">No matching categories. Try another search.</p>}
        </fieldset>
        {errors.categoryId && <p id="registration-categoryId-error" role="alert" className="text-xs text-error">{errors.categoryId}</p>}
      </RegistrationSection>
      <RegistrationSection title="Asset specification" description="The selected category determines whether a serial number is required.">
        <RegistrationTextField name="serialNumber" label="Serial Number" required={selected?.is_serial_required} value={draft.serialNumber} maxLength={250} onChange={(event) => patch({ serialNumber: event.target.value })} error={errors.serialNumber} />
        <UnavailableRegistrationFields labels={["Brand", "Model", "Asset Type", "Screen Size", "Resolution", "Color", "Mounting Type", "Dimensions", "Weight", "Power Consumption", "Specification / Remarks"]} />
      </RegistrationSection>
    </div>
  );
}
