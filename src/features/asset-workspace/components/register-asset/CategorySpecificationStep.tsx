import { ArrowLeftIcon, CheckCircleIcon, ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { useRegistrationSelector } from "../../hooks/use-registration-selector";
import { selectedReference, selectedReferenceLabel } from "../../domain/registration-references";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationHelp, RegistrationSection, RegistrationTextField, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationCategoryCard, RegistrationCategoryGrid } from "./RegistrationCategoryCard";
import { RegistrationSelectorStatus } from "./RegistrationSelectorStatus";
import { cn } from "@/lib/utils";

export function CategorySpecificationStep({ draft, options, errors, patch, context, onSelectReference }: RegistrationStepProps & {
  context: string; onSelectReference: (kind: "categories", item: ReferenceItem) => void;
}) {
  const selector = useRegistrationSelector(context, "categories", options.referenceSelectors);
  const selected = selectedReference(draft, "categories");
  const parent = selector.trail.at(-1);
  const serialError = errors.serialNumber ?? (selected?.is_serial_required && !draft.serialNumber.trim() ? "This category requires a serial number." : undefined);
  return (
    <div className="@container/categories min-w-0 space-y-3">
      <RegistrationSection title="Category" description="Select a category or browse its children.">
        <label htmlFor="registration-category-search" className="sr-only">
          Search categories
        </label>
        <div className="relative">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="registration-category-search"
            type="search"
            placeholder="Search all categories…"
            className="pl-9 max-sm:h-10"
            autoComplete="off"
            aria-controls="registration-categoryId"
            maxLength={options.referenceSelectors.search.maxLength}
            value={selector.search}
            onChange={(event) => selector.setSearch(event.target.value)}
          />
        </div>
        {parent && !selector.search.trim() && (
          <div className="space-y-2 border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.root}>
                All categories
              </Button>
              <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.back}>
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-accent-foreground max-sm:h-10"
                onClick={() => onSelectReference("categories", parent)}
              >
                Select this parent
              </Button>
            </div>
            <p className="break-words text-xs leading-relaxed text-muted-foreground">
              {selector.trail.map((item) => item.name || item.code || "Unnamed category").join(" › ")}
            </p>
          </div>
        )}
        {draft.categoryId && (
          <p className="flex items-start gap-2 rounded-control bg-muted p-3 text-xs leading-relaxed text-foreground">
            <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
            <span className="min-w-0 break-words">
              <span className="font-semibold">Selected: </span>
              {selectedReferenceLabel(draft, "categories")}
            </span>
          </p>
        )}
        <fieldset
          id="registration-categoryId"
          tabIndex={-1}
          className="min-w-0 rounded-control focus-visible:outline-2 focus-visible:outline-ring"
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={errors.categoryId ? "registration-categoryId-error" : undefined}
          aria-busy={selector.busy}
        >
          <legend className="sr-only">Category (required)</legend>
          <RegistrationCategoryGrid>
            {selector.items.map((category) => {
              const isSelected = draft.categoryId.toLowerCase() === category.id;
              return (
                <div
                  key={category.id}
                  className={cn("flex min-w-0 flex-col overflow-hidden rounded-control border", isSelected ? "border-primary" : "border-border")}
                >
                  <RegistrationCategoryCard
                    category={category}
                    path={referenceLabel(category, "categories")}
                    parentPath={category.parent?.name || category.code || ""}
                    selected={isSelected}
                    onSelect={() => onSelectReference("categories", category)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto min-h-8 w-full justify-between whitespace-normal rounded-none border-t border-border px-3 py-2 text-xs max-sm:min-h-10"
                    aria-label={`Browse children of ${category.name || category.code || "this category"}`}
                    onClick={() => selector.browse(category)}
                  >
                    Browse children
                    <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
                  </Button>
                </div>
              );
            })}
          </RegistrationCategoryGrid>
        </fieldset>
        <RegistrationSelectorStatus selector={selector} cards />
        {errors.categoryId && (
          <p id="registration-categoryId-error" role="alert" className="text-xs text-error">
            {errors.categoryId}
          </p>
        )}
      </RegistrationSection>
      <RegistrationSection title="Asset specification" description="Enter the serial number for this asset.">
        <div className="max-w-xl">
          <RegistrationTextField
            name="serialNumber"
            label="Serial Number"
            required={selected?.is_serial_required}
            value={draft.serialNumber}
            className="max-sm:h-10"
            maxLength={250}
            onChange={(event) => patch({ serialNumber: event.target.value })}
            error={serialError}
            hint={selected?.is_serial_required ? "Required for the selected category." : "Optional unless the selected category requires a serial number."}
          />
        </div>
        <div className="border-t border-border pt-1">
          <RegistrationHelp>
            <p>Parent and child categories can both be selected. Browsing children does not change your selected category.</p>
            <p>Duplicate serial numbers are checked at final creation.</p>
          </RegistrationHelp>
        </div>
      </RegistrationSection>
    </div>
  );
}
