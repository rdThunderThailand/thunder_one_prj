import { LocationIcon, UserIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { registrationInitialConditions, registrationInitialStatus } from "../../domain/registration-initial-state";
import { selectedReference, selectedReferenceLabel } from "../../domain/registration-references";
import type { ReferenceItem, SelectorKind } from "../../services/registration-selector-contract";
import { StatusBadge } from "../StatusBadges";
import { RegistrationHelp, RegistrationSection, RegistrationSelect, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationReferenceSelect } from "./RegistrationReferenceSelect";

export function LocationOwnershipStep({ draft, options, errors, patch, onReviewCondition, context, onSelectReference }: RegistrationStepProps & {
  onReviewCondition: () => void; context: string; onSelectReference: (kind: SelectorKind, item: ReferenceItem) => void;
}) {
  const location = selectedReference(draft, "locations");
  const locationLabel = selectedReferenceLabel(draft, "locations");
  const kind = draft.custodyType === "person" ? "persons" : "orgUnits";
  const status = registrationInitialStatus(draft, options);
  const conditionConflict = !registrationInitialConditions(draft, options).includes(draft.condition);
  return (
    <div className="space-y-3">
      <RegistrationSection title="Location" icon={LocationIcon} description="Select where this asset is located.">
        <RegistrationReferenceSelect
          name="locationId" label="Location" value={draft.locationId}
          kind="locations" context={context} rules={options.referenceSelectors} selectedLabel={locationLabel}
          onChange={(item) => onSelectReference("locations", item)} error={errors.locationId}
        />
        {location && (
          <div aria-label="Selected location" className="flex items-start gap-3 rounded-control bg-muted p-3">
            <LocationIcon className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <h3 className="break-words text-sm font-semibold">{location.name || "Unnamed location"}</h3>
              <p className="break-words text-xs text-muted-foreground">{locationLabel}</p>
              {location.location_type && <p className="break-words text-xs text-muted-foreground">Type: {location.location_type.replaceAll("_", " ")}</p>}
            </div>
          </div>
        )}
      </RegistrationSection>
      <RegistrationSection title="Ownership & assignment" icon={UserIcon} description="Choose an initial custodian, or leave unassigned.">
        <div className="grid gap-3 sm:grid-cols-2">
          <RegistrationSelect
            name="custodyType" label="Custody target type" value={draft.custodyType}
            items={[{ value: "none", label: "Unassigned" }, { value: "person", label: "Person" }, { value: "org_unit", label: "Organizational Unit" }]}
            onChange={(value) => patch({ custodyType: value as typeof draft.custodyType })}
          />
          {draft.custodyType !== "none" && (
            <RegistrationReferenceSelect
              key={draft.custodyType}
              name="custodyId" label={draft.custodyType === "person" ? "Person" : "Organizational Unit"} value={draft.custodyId}
              kind={kind} context={context} rules={options.referenceSelectors} selectedLabel={selectedReferenceLabel(draft, kind)}
              onChange={(item) => onSelectReference(kind, item)} error={errors.custodyId}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Initial status</span>
          <StatusBadge status={status} />
        </div>
        {conditionConflict && (
          <div role="alert" className="flex items-start gap-3 rounded-control bg-warning-muted p-3 text-xs text-foreground">
            <WarningTriangleIcon className="h-5 w-5 text-warning" />
            <div className="space-y-2">
              <p>{draft.condition} is not allowed with {status} status. Select valid initial custody or review the condition in Step 1 before continuing. Your entered values have been kept.</p>
              <Button variant="outline" size="sm" onClick={onReviewCondition}>Review condition</Button>
            </div>
          </div>
        )}
        <RegistrationHelp>
          <p>Parent and child locations can both be selected. Custody does not change the asset’s organization or location.</p>
          <p>Handover evidence is not required or available in this version. Add general asset notes in Step 4.</p>
        </RegistrationHelp>
      </RegistrationSection>
    </div>
  );
}
