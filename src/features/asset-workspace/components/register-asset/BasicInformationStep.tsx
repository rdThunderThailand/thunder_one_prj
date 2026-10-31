import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Textarea } from "@/components/ui/lovable/textarea";
import { registrationInitialConditions, registrationInitialStatus } from "../../domain/registration-initial-state";
import { RegistrationField, RegistrationSection, RegistrationSelect, RegistrationTextField, type RegistrationStepProps } from "./RegistrationFields";

export function BasicInformationStep({ draft, options, errors, patch }: RegistrationStepProps) {
  const automatic = draft.tagMode === "automatic";
  const conditions = registrationInitialConditions(draft, options);
  const conditionError = errors.condition ?? (!conditions.includes(draft.condition)
    ? "This condition is not allowed for the current status. Choose another condition or restore valid custody in Step 3." : undefined);
  const tagError = errors.assetCode ?? errors.tagMode;
  const tagHint = automatic
    ? "Format preview only. The actual tag is assigned on successful creation; no number is reserved."
    : "Must be unique within this organization.";
  return (
    <RegistrationSection title="Asset information" description="Basic identification and description of the asset.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <RegistrationTextField
            name="name" label="Asset Name" required maxLength={250}
            value={draft.name} onChange={(event) => patch({ name: event.target.value })} error={errors.name}
          />
          <RegistrationField name="description" label="Description" error={errors.description} hint={`${draft.description.length}/5000 characters`}>
            <Textarea
              id="registration-description" rows={5} maxLength={5000} value={draft.description}
              placeholder="Describe this asset and how it will be used…"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={`registration-description-hint${errors.description ? " registration-description-error" : ""}`}
              onChange={(event) => patch({ description: event.target.value })}
            />
          </RegistrationField>
        </div>
        <div className="space-y-4">
          <RegistrationField name="assetCode" label="Asset Tag" required={!automatic} error={tagError} hint={tagHint}>
            <div className="flex flex-wrap gap-2">
              <Input
                id="registration-assetCode" className="min-w-0 flex-1" maxLength={100}
                value={automatic ? options.tagGeneration.format || "Generated on creation" : draft.assetCode}
                readOnly={automatic} aria-required={!automatic} aria-invalid={Boolean(tagError)}
                aria-describedby={`registration-assetCode-hint${tagError ? " registration-assetCode-error" : ""}`}
                onChange={(event) => patch({ assetCode: event.target.value })}
              />
              {options.tagGeneration.modes.length > 1 && (
                <Button variant="outline" size="sm" className="h-10" onClick={() => patch({ tagMode: automatic ? "manual" : "automatic" })}>
                  {automatic ? "Enter manually" : "Auto-generate"}
                </Button>
              )}
            </div>
          </RegistrationField>
          <div className="grid gap-4 lg:grid-cols-2">
            <RegistrationTextField
              name="status" label="Initial status" value={registrationInitialStatus(draft, options)}
              readOnly hint="Determined by initial custody in Step 3."
            />
            <RegistrationSelect
              name="condition" label="Condition" required value={draft.condition}
              items={[...conditions.map((value) => ({ value, label: value })), ...(!conditions.includes(draft.condition)
                ? [{ value: draft.condition, label: `${draft.condition} — not allowed`, disabled: true }] : [])]}
              onChange={(value) => patch({ condition: value as typeof draft.condition })} error={conditionError}
            />
          </div>
          <p className="text-xs text-muted-foreground">Damaged is available only when valid initial custody is selected in Step 3.</p>
        </div>
      </div>
    </RegistrationSection>
  );
}
