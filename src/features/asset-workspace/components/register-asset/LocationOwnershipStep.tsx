import { useMemo } from "react";
import { LocationIcon, UserIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { registrationInitialConditions, registrationInitialStatus } from "../../domain/registration-initial-state";
import { registrationCustodyChoices, registrationLocationChoices } from "../../domain/registration-reference-choices";
import { StatusBadge } from "../StatusBadges";
import { RegistrationSection, RegistrationSelect, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationReferenceSelect } from "./RegistrationReferenceSelect";

export function LocationOwnershipStep({ draft, options, errors, patch, onReviewCondition }: RegistrationStepProps & { onReviewCondition: () => void }) {
  const locations = useMemo(() => registrationLocationChoices(options), [options]);
  const targets = useMemo(() => registrationCustodyChoices(draft.custodyType, options), [draft.custodyType, options]);
  const location = options.locations.find((item) => item.id === draft.locationId);
  const locationLabel = locations.find((item) => item.value === draft.locationId)?.label;
  const custody = targets.find((item) => item.value === draft.custodyId);
  const status = registrationInitialStatus(draft, options);
  const conditionConflict = !registrationInitialConditions(draft, options).includes(draft.condition);
  const locationError = draft.locationId && !location
    ? "Your selected location is no longer available. Choose an active location." : errors.locationId;
  const custodyError = draft.custodyType !== "none" && draft.custodyId && !custody
    ? "Your previous custody target is no longer available. Choose an active target or leave unassigned." : errors.custodyId;
  return (
    <div className="space-y-3">
      <RegistrationSection title="Location" icon={LocationIcon} description="Specify where this asset is located. Select one parent or child location.">
        <RegistrationReferenceSelect
          name="locationId" label="Location" required value={draft.locationId}
          items={locations} onChange={(value) => patch({ locationId: value })} error={locationError}
          emptyMessage="No active locations are available. Ask your administrator to configure a location."
        />
        {location && (
          <div aria-label="Selected location" className="flex items-start gap-3 rounded-control bg-muted p-4">
            <LocationIcon className="h-8 w-8 text-primary" />
            <div className="min-w-0 space-y-2">
              <h3 className="break-words text-sm font-semibold">{location.name || "Unnamed location"}</h3>
              <p className="break-words text-xs text-muted-foreground">{locationLabel}</p>
              {location.location_type && <p className="break-words text-xs text-muted-foreground">Type: {location.location_type.replaceAll("_", " ")}</p>}
            </div>
          </div>
        )}
      </RegistrationSection>
      <RegistrationSection title="Ownership & assignment" icon={UserIcon} description="Choose a person or organizational unit as the initial custodian, or leave unassigned. This does not change the asset’s organization or location.">
        <div className="grid gap-4 sm:grid-cols-2">
          <RegistrationSelect
            name="custodyType" label="Custody target type" value={draft.custodyType}
            items={[{ value: "none", label: "Unassigned" }, { value: "person", label: "Person" }, { value: "org_unit", label: "Organizational Unit" }]}
            onChange={(value) => patch({ custodyType: value as typeof draft.custodyType })}
          />
          {draft.custodyType !== "none" && (
            <RegistrationReferenceSelect
              key={draft.custodyType}
              name="custodyId" label={draft.custodyType === "person" ? "Person" : "Organizational Unit"} required value={draft.custodyId}
              items={targets} onChange={(value) => patch({ custodyId: value })} error={custodyError}
              emptyMessage="No active custody targets are available. Choose another target type or leave unassigned."
              hint={targets.length ? undefined : "No active targets are available. Choose another target type or leave unassigned."}
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
        <p className="text-xs text-muted-foreground">Handover evidence is not available in this version and is not required. General asset notes belong in Step 4.</p>
      </RegistrationSection>
    </div>
  );
}
