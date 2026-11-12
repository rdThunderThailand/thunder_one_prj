import { selectedReference, selectedReferenceLabel } from "../../domain/registration-references";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationHelp, RegistrationSection, RegistrationTextField, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationTreeField } from "./RegistrationTreeField";

export function CategorySpecificationStep({ draft, options, errors, patch, context, onSelectReference }: RegistrationStepProps & {
  context: string; onSelectReference: (kind: "categories", item: ReferenceItem) => void;
}) {
  const selected = selectedReference(draft, "categories");
  const serialError = errors.serialNumber ?? (selected?.is_serial_required && !draft.serialNumber.trim() ? "This category requires a serial number." : undefined);
  return (
    <div className="@container/categories min-w-0 space-y-3">
      <RegistrationSection title="Category & specification" description="Choose what kind of asset this is, then add its serial number.">
        <div className="max-w-xl space-y-4">
          <RegistrationTreeField kind="categories" name="categoryId" label="Category" value={draft.categoryId}
            selectedLabel={draft.categoryId ? selectedReferenceLabel(draft, "categories") : ""} context={context}
            rules={options.referenceSelectors} error={errors.categoryId} onChange={(item) => onSelectReference("categories", item)} />
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
            <p>You can choose a parent category or any of its subcategories. Open a category with › to see its subcategories.</p>
            <p>Duplicate serial numbers are checked at final creation.</p>
          </RegistrationHelp>
        </div>
      </RegistrationSection>
    </div>
  );
}
