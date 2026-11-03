import { Textarea } from "@/components/ui/lovable/textarea";
import { FileTextIcon, ClipboardIcon } from "@/components/ui/icons";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import { RegistrationField, RegistrationHelp, RegistrationSection, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationDateField } from "./RegistrationDateField";
import { RegistrationDocuments } from "./RegistrationDocuments";
import { RegistrationWarranties } from "./RegistrationWarranties";

export function AcquisitionWarrantyStep(props: RegistrationStepProps & { documents: DocumentsController }) {
  const { draft, options, errors, patch, documents } = props;
  return (
    <div className="space-y-3">
      <RegistrationSection title="Acquisition information" icon={FileTextIcon} description="Optionally record when this asset was acquired.">
        <div className="max-w-sm">
          <RegistrationDateField name="purchaseDate" label="Acquisition Date" value={draft.purchaseDate} onChange={(purchaseDate) => patch({ purchaseDate })} error={errors.purchaseDate} />
        </div>
      </RegistrationSection>
      <RegistrationWarranties {...props} />
      <RegistrationSection title="Additional information" icon={ClipboardIcon}>
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <RegistrationDocuments target="asset" label="Asset documents" hasSelections={draft.hasDocumentSelections} documents={documents} rules={options.documentUpload} />
          <RegistrationField name="notes" label="Asset Notes" error={errors.notes} hint={`${draft.notes.length}/5000 characters`}>
            <Textarea id="registration-notes" rows={3} maxLength={5000} value={draft.notes} aria-invalid={Boolean(errors.notes)} aria-describedby={`registration-notes-hint${errors.notes ? " registration-notes-error" : ""}`} placeholder="Add useful notes about this asset…" onChange={(event) => patch({ notes: event.target.value })} />
          </RegistrationField>
        </div>
        <RegistrationHelp>
          <p>Registration time is recorded on creation, separately from the acquisition date.</p>
          <p>Asset documents are separate from warranty documents. Asset Notes are separate from the Description in Step 1.</p>
        </RegistrationHelp>
      </RegistrationSection>
    </div>
  );
}
