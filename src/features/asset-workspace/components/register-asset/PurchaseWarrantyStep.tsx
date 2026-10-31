import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { Textarea } from "@/components/ui/lovable/textarea";
import { RegistrationField, RegistrationSection, RegistrationTextField, UnavailableRegistrationFields, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationDateField } from "./RegistrationDateField";

export function PurchaseWarrantyStep({ draft, errors, patch }: RegistrationStepProps) {
  return (
    <div className="space-y-3">
      <RegistrationSection title="Purchase information" description="Record when this asset was acquired. Registration time is recorded separately on creation.">
        <div className="grid gap-4 sm:grid-cols-2">
          <RegistrationDateField
            name="purchaseDate" label="Acquisition Date" value={draft.purchaseDate}
            onChange={(value) => patch({ purchaseDate: value })} error={errors.purchaseDate}
          />
          <RegistrationField name="acquisitionCost" label="Acquisition Cost">
            <div className="flex gap-2">
              <Input id="registration-acquisitionCost" disabled placeholder="Not available yet" />
              <Input aria-label="Currency" className="w-24 shrink-0" disabled placeholder="Currency" />
            </div>
          </RegistrationField>
          <RegistrationTextField name="supplier" label="Supplier" disabled placeholder="Not available yet" />
          <RegistrationTextField name="invoice" label="Invoice / PO Number" disabled placeholder="Not available yet" />
        </div>
        <p className="text-xs text-muted-foreground">Acquisition cost, currency, supplier and invoice / PO are not available in this version and will not be saved.</p>
      </RegistrationSection>
      <RegistrationSection title="Warranty information" description="Optionally include one initial warranty. Current warranty selection is explicit and is not inferred from its dates.">
        <label className="relative flex min-h-8 cursor-pointer items-center gap-2 text-xs font-medium">
          <Checkbox checked={draft.warrantyEnabled} onCheckedChange={(checked) => patch({ warrantyEnabled: checked === true })} />
          Include warranty
        </label>
        {draft.warrantyEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <RegistrationTextField
              name="warrantyProvider" label="Warranty Provider" required maxLength={500} value={draft.warrantyProvider}
              onChange={(event) => patch({ warrantyProvider: event.target.value })} error={errors.warrantyProvider}
            />
            <RegistrationTextField
              name="warrantyType" label="Warranty Type" maxLength={250} value={draft.warrantyType}
              onChange={(event) => patch({ warrantyType: event.target.value })}
            />
            <RegistrationDateField
              name="warrantyStart" label="Warranty Start Date" value={draft.warrantyStart}
              onChange={(value) => patch({ warrantyStart: value })} error={errors.warrantyStart}
            />
            <RegistrationTextField
              name="warrantyYears" label="Warranty Period (years)" type="number" min={1} step={1} value={draft.warrantyYears}
              onChange={(event) => patch({ warrantyYears: event.target.value })} error={errors.warrantyYears}
            />
            <RegistrationDateField
              name="warrantyEnd" label="Warranty End Date" value={draft.warrantyEnd} readOnly
              hint="Calculated from the start date and period, including the first day of coverage." error={errors.warrantyEnd}
            />
            <RegistrationTextField
              name="warrantyReference" label="Warranty Reference" maxLength={250} value={draft.warrantyReference}
              onChange={(event) => patch({ warrantyReference: event.target.value })}
            />
            <div className="sm:col-span-2">
              <RegistrationField name="warrantyTerms" label="Warranty Terms">
                <Textarea
                  id="registration-warrantyTerms" maxLength={5000} rows={3} value={draft.warrantyTerms}
                  onChange={(event) => patch({ warrantyTerms: event.target.value })}
                />
              </RegistrationField>
              <label className="relative mt-3 flex min-h-8 cursor-pointer items-center gap-2 text-xs font-medium">
                <Checkbox checked={draft.warrantyCurrent} onCheckedChange={(checked) => patch({ warrantyCurrent: checked === true })} />
                Set as current warranty
              </label>
            </div>
          </div>
        )}
      </RegistrationSection>
      <RegistrationSection title="Additional information" description="Optional asset notes. Photos and documents can’t be uploaded in this version.">
        <RegistrationField name="notes" label="Asset Notes" hint={`${draft.notes.length}/5000 characters`}>
          <Textarea
            id="registration-notes" aria-describedby="registration-notes-hint" rows={4} maxLength={5000}
            value={draft.notes} onChange={(event) => patch({ notes: event.target.value })}
            placeholder="Add useful notes about this asset…"
          />
        </RegistrationField>
        <UnavailableRegistrationFields labels={["Attachment"]} />
      </RegistrationSection>
    </div>
  );
}
