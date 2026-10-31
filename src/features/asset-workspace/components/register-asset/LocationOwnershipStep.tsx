import { locationPath } from "../../domain/registration-validation";
import { Button } from "@/components/ui/lovable/button";
import { RegistrationSection, RegistrationSelect, UnavailableRegistrationFields, type RegistrationStepProps } from "./RegistrationFields";

export function LocationOwnershipStep({ draft, options, errors, patch }: RegistrationStepProps) {
  const targets = draft.custodyType === "person" ? options.persons : options.orgUnits;
  return (
    <div className="space-y-3">
      <RegistrationSection title="Location" description="Specify where this asset is located.">
        <RegistrationSelect
          name="locationId" label="Location" required value={draft.locationId}
          items={options.locations.map((item) => ({ value: item.id, label: locationPath(item.id, options) }))}
          onChange={(value) => patch({ locationId: value })} error={errors.locationId}
        />
        {draft.locationId && (
          <div className="space-y-3 rounded-control bg-muted p-3 text-xs text-muted-foreground">
            <p>{locationPath(draft.locationId, options) || "This location is no longer available. Choose another location."}</p>
            <Button variant="outline" size="sm" disabled aria-describedby="registration-location-details-reason">View Location Details</Button>
            <p id="registration-location-details-reason">Location details are not available in this version.</p>
          </div>
        )}
        <UnavailableRegistrationFields labels={["Specific Location", "Building", "Floor", "Area / Zone"]} />
      </RegistrationSection>
      <RegistrationSection title="Ownership & assignment" description="Choose one initial custodian: a person or an organizational unit. Leave unassigned if there is no initial custody.">
        <div className="grid gap-4 sm:grid-cols-2">
          <RegistrationSelect
            name="custodyType" label="Custody target type" value={draft.custodyType}
            items={[{ value: "none", label: "Unassigned" }, { value: "person", label: "Person" }, { value: "org_unit", label: "Organizational Unit" }]}
            onChange={(value) => patch({ custodyType: value as typeof draft.custodyType })}
          />
          {draft.custodyType !== "none" && (
            <RegistrationSelect
              name="custodyId" label={draft.custodyType === "person" ? "Person" : "Organizational Unit"} required value={draft.custodyId}
              items={targets.map((item) => ({ value: item.id, label: `${item.name || "Unnamed"} · ${item.id.slice(0, 8)}` }))}
              onChange={(value) => patch({ custodyId: value })} error={errors.custodyId}
              hint={targets.length ? undefined : "No active targets are available. Choose another target type or leave unassigned."}
            />
          )}
        </div>
        <UnavailableRegistrationFields labels={["Ownership Notes"]} />
      </RegistrationSection>
    </div>
  );
}
