import { SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { useRegistrationSelector } from "../../hooks/use-registration-selector";
import { selectedReference, selectedReferenceLabel } from "../../domain/registration-references";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationHelp, RegistrationSection, RegistrationTextField, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationCategoryCard } from "./RegistrationCategoryCard";
import { RegistrationSelectorStatus } from "./RegistrationSelectorStatus";

export function CategorySpecificationStep({ draft, options, errors, patch, context, onSelectReference }: RegistrationStepProps & {
  context: string; onSelectReference: (kind: "categories", item: ReferenceItem) => void;
}) {
  const selector = useRegistrationSelector(context, "categories", options.referenceSelectors);
  const selected = selectedReference(draft, "categories");
  const serialError = errors.serialNumber ?? (selected?.is_serial_required && !draft.serialNumber.trim() ? "This category requires a serial number." : undefined);
  return (
    <div className="space-y-3">
      <RegistrationSection title="Category" description="Select a category or browse its children.">
        <label htmlFor="registration-category-search" className="sr-only">Search categories</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="registration-category-search" placeholder="Search all categories…" className="pl-9" maxLength={options.referenceSelectors.search.maxLength}
            value={selector.search} onChange={(event) => selector.setSearch(event.target.value)} />
        </div>
        {selector.trail.length > 0 && !selector.search.trim() && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button variant="outline" size="sm" onClick={selector.root}>All categories</Button>
            <Button variant="outline" size="sm" onClick={selector.back}>Back</Button>
            <span className="break-words">{selector.trail.map((item) => item.name).join(" › ")}</span>
            <Button variant="outline" size="sm" onClick={() => onSelectReference("categories", selector.trail.at(-1)!)}>Select this parent</Button>
          </div>
        )}
        {draft.categoryId && <p className="break-words text-xs text-muted-foreground">Selected: {selectedReferenceLabel(draft, "categories")}</p>}
        <fieldset id="registration-categoryId" tabIndex={-1} aria-invalid={Boolean(errors.categoryId)}>
          <legend className="sr-only">Category (required)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {selector.items.map((category) => (
              <div key={category.id} className={`min-w-0 overflow-hidden rounded-control border ${draft.categoryId.toLowerCase() === category.id ? "border-primary" : "border-border"}`}>
                <RegistrationCategoryCard category={category} path={referenceLabel(category, "categories")} parentPath={category.parent?.name || category.code || ""}
                  selected={draft.categoryId.toLowerCase() === category.id} onSelect={() => onSelectReference("categories", category)} />
                <Button variant="ghost" size="sm" className="w-full rounded-none border-t border-border px-2 text-xs" aria-label={`Browse children of ${category.name}`} onClick={() => selector.browse(category)}>Browse children</Button>
              </div>
            ))}
          </div>
        </fieldset>
        <RegistrationSelectorStatus selector={selector} cards />
        {errors.categoryId && <p role="alert" className="text-xs text-error">{errors.categoryId}</p>}
      </RegistrationSection>
      <RegistrationSection title="Asset specification">
        <RegistrationTextField name="serialNumber" label="Serial Number" required={selected?.is_serial_required} value={draft.serialNumber}
          maxLength={250} onChange={(event) => patch({ serialNumber: event.target.value })} error={serialError}
          hint={selected?.is_serial_required ? "Required for the selected category." : "Optional unless the selected category requires a serial number."} />
        <RegistrationHelp>
          <p>Parent and child categories can both be selected. Browsing children does not change your selected category.</p>
          <p>Duplicate serial numbers are checked at final creation.</p>
        </RegistrationHelp>
      </RegistrationSection>
    </div>
  );
}
