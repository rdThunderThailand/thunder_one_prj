import { useMemo, useRef, useState } from "react";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { registrationCategoryChoices } from "../../domain/registration-categories";
import { RegistrationSection, RegistrationTextField, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationCategoryCard } from "./RegistrationCategoryCard";

export function CategorySpecificationStep({ draft, options, errors, patch }: RegistrationStepProps) {
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const choices = useMemo(() => registrationCategoryChoices(options.categories), [options.categories]);
  const query = search.trim().toLocaleLowerCase();
  const matches = choices.filter((choice) => choice.path.toLocaleLowerCase().includes(query));
  const selected = choices.find((choice) => choice.category.id === draft.categoryId);
  const serialError = errors.serialNumber ?? (selected?.category.is_serial_required && !draft.serialNumber.trim()
    ? "This category requires a serial number." : undefined);

  function clearSearch() {
    setSearch("");
    searchInput.current?.focus();
  }

  return (
    <div className="space-y-3">
      <RegistrationSection title="Category" description="Select the category that best fits this asset. Parent and child categories can both be selected.">
        <label htmlFor="registration-category-search" className="sr-only">Search categories</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInput} id="registration-category-search" placeholder="Search categories…" className="pl-9 pr-10"
            value={search} onChange={(event) => setSearch(event.target.value)} aria-describedby="registration-category-results"
          />
          {search && (
            <Button variant="ghost" size="icon-sm" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label="Clear category search" onClick={clearSearch}>
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selected && !matches.some((choice) => choice.category.id === selected.category.id) && (
          <div aria-label="Selected category" className="space-y-1 rounded-control bg-muted p-3 text-xs">
            <p className="font-medium">Selected category</p>
            <p className="break-words text-muted-foreground">{selected.path}</p>
          </div>
        )}
        <p id="registration-category-results" role="status" className="sr-only">
          {matches.length} of {choices.length} categories{query ? " match your search" : " available"}
        </p>
        <fieldset id="registration-categoryId" tabIndex={-1} aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? "registration-categoryId-error" : undefined}>
          <legend className="sr-only">Category (required)</legend>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {matches.map(({ category, path, parentPath }) => (
              <RegistrationCategoryCard
                key={category.id} category={category} path={path} parentPath={parentPath}
                selected={draft.categoryId === category.id} onSelect={() => patch({ categoryId: category.id })}
              />
            ))}
          </div>
          {choices.length === 0 ? (
            <p className="py-4 text-xs text-muted-foreground">No active categories are available. Ask your administrator to configure a category before continuing.</p>
          ) : matches.length === 0 && (
            <div className="space-y-2 py-4 text-xs text-muted-foreground">
              <p>No matching categories. Try another name or parent category.</p>
              <Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>
            </div>
          )}
        </fieldset>
        {draft.categoryId && !selected && (
          <p role="alert" className="text-xs text-error">Your selected category is no longer available. Choose an active category; your other information has been kept.</p>
        )}
        {errors.categoryId && <p id="registration-categoryId-error" role="alert" className="text-xs text-error">{errors.categoryId}</p>}
      </RegistrationSection>
      <RegistrationSection title="Asset specification" description="Record the serial number for this asset, if available or required by its category.">
        <RegistrationTextField
          name="serialNumber" label="Serial Number" required={selected?.category.is_serial_required} value={draft.serialNumber}
          maxLength={250} onChange={(event) => patch({ serialNumber: event.target.value })} error={serialError}
          hint={selected?.category.is_serial_required ? "Required for the selected category." : "Optional unless the selected category requires a serial number."}
        />
        <p className="text-xs text-muted-foreground">Duplicate serial numbers are checked at final creation.</p>
      </RegistrationSection>
    </div>
  );
}
