import { RegistrationSection, RegistrationSelect, RegistrationTextField, UnavailableRegistrationFields, type RegistrationStepProps } from "./RegistrationFields";

export function BasicInformationStep({ draft, options, errors, patch }: RegistrationStepProps) {
  return (
    <RegistrationSection title="Asset information" description="Basic identification and condition of the asset.">
      <div className="grid gap-4 sm:grid-cols-2">
        <RegistrationTextField
          name="name" label="Asset Name" required maxLength={250}
          value={draft.name} onChange={(event) => patch({ name: event.target.value })} error={errors.name}
        />
        <RegistrationSelect
          name="tagMode" label="Asset Tag mode" required value={draft.tagMode}
          items={options.tagGeneration.modes.map((value) => ({ value, label: value === "automatic" ? "Auto-generate" : "Enter manually" }))}
          onChange={(value) => patch({ tagMode: value as typeof draft.tagMode })} error={errors.tagMode}
        />
        <RegistrationTextField
          name="assetCode" label="Asset Tag" required={draft.tagMode === "manual"} maxLength={100}
          value={draft.tagMode === "automatic" ? "Generated on creation" : draft.assetCode}
          readOnly={draft.tagMode === "automatic"} onChange={(event) => patch({ assetCode: event.target.value })}
          hint={draft.tagMode === "automatic" ? "A tag will be allocated when asset creation becomes available." : "Must be unique within this organization."}
          error={errors.assetCode}
        />
        <RegistrationSelect
          name="condition" label="Condition" required value={draft.condition}
          items={options.initialConditions.map((value) => ({ value, label: value }))}
          onChange={(value) => patch({ condition: value as typeof draft.condition })} error={errors.condition}
        />
        <RegistrationTextField
          name="status" label="Initial status" value={draft.custodyType === "none" ? "Available" : "Assigned"}
          readOnly hint="Determined by the initial custody selected in Step 3."
        />
      </div>
      <UnavailableRegistrationFields labels={["Description"]} />
    </RegistrationSection>
  );
}
