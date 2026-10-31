import { Textarea } from "@/components/ui/lovable/textarea";
import { FileTextIcon, ClipboardIcon } from "@/components/ui/icons";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import { RegistrationField, RegistrationSection, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationDateField } from "./RegistrationDateField";
import { RegistrationDocuments } from "./RegistrationDocuments";
import { RegistrationWarranties } from "./RegistrationWarranties";

export function AcquisitionWarrantyStep(props: RegistrationStepProps & { documents: DocumentsController }) {
  const { draft, options, errors, patch, documents } = props;
  return (
    <div className="space-y-3">
      <RegistrationSection title="Acquisition information" icon={FileTextIcon} description="Optionally record when this asset was acquired. Registration time is generated separately on creation.">
        <RegistrationDateField name="purchaseDate" label="Acquisition Date" value={draft.purchaseDate} onChange={(purchaseDate) => patch({ purchaseDate })} error={errors.purchaseDate} />
      </RegistrationSection>
      <RegistrationWarranties {...props} />
      <RegistrationSection title="Additional information" icon={ClipboardIcon} description="Optional Asset documents and notes, separate from each warranty’s documents and Step 1 Description.">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <RegistrationDocuments target="asset" label="Asset documents" hasSelections={draft.hasDocumentSelections} documents={documents} rules={options.documentUpload} />
          <RegistrationField name="notes" label="Asset Notes" hint={`${draft.notes.length}/5000 characters`}>
            <Textarea id="registration-notes" rows={5} maxLength={5000} value={draft.notes} aria-describedby="registration-notes-hint" placeholder="Add useful notes about this asset…" onChange={(event) => patch({ notes: event.target.value })} />
          </RegistrationField>
        </div>
      </RegistrationSection>
    </div>
  );
}
