import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Textarea } from "@/components/ui/lovable/textarea";
import { ChevronDownIcon, TrashIcon } from "@/components/ui/icons";
import type { WarrantyDraft, WarrantyErrors } from "../../domain/registration-warranties";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationField, RegistrationTextField } from "./RegistrationFields";
import { RegistrationDateField } from "./RegistrationDateField";
import { RegistrationDocuments } from "./RegistrationDocuments";

export function RegistrationWarrantyPanel({ warranty, index, errors, currentMissing, documents, rules, onPatch, onCurrent, onRemove }: {
  warranty: WarrantyDraft; index: number; errors: WarrantyErrors; currentMissing: boolean;
  documents: DocumentsController; rules: RegistrationOptions["documentUpload"];
  onPatch: (changes: Partial<WarrantyDraft>) => void; onCurrent: () => void; onRemove: () => void;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const prefix = `warranty-${warranty.clientId}`;
  useLayoutEffect(() => {
    if (Object.keys(errors).length && details.current) details.current.open = true;
  }, [errors]);
  return (
    <section aria-label={`Warranty ${index + 1}`} className="space-y-3 rounded-control border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold">Warranty {index + 1}</h3>
        <div className="flex items-center gap-3">
          <label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs">
            <input
              type="radio" name="registration-current-warranty" className="h-4 w-4 accent-primary"
              checked={warranty.isCurrent} onChange={onCurrent} aria-label={`Set warranty ${index + 1} as Current`}
              aria-describedby={currentMissing ? "registration-warranties-error" : undefined}
            />
            Current
          </label>
          <Button variant="ghost" size="icon-sm" aria-label={`Remove warranty ${index + 1}`} onClick={onRemove}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <details ref={details} open className="group">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 rounded-control text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 break-words">{warranty.provider.trim() || "New warranty"}</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <RegistrationTextField name={`${prefix}-provider`} label="Warranty Provider" required maxLength={500} value={warranty.provider} onChange={(event) => onPatch({ provider: event.target.value })} error={errors.provider} />
          <RegistrationTextField name={`${prefix}-type`} label="Warranty Type" maxLength={250} value={warranty.type} onChange={(event) => onPatch({ type: event.target.value })} error={errors.type} />
          <RegistrationDateField name={`${prefix}-start`} label="Warranty Start Date" value={warranty.startDate} onChange={(startDate) => onPatch({ startDate })} error={errors.startDate} />
          <RegistrationDateField name={`${prefix}-end`} label="Warranty End Date" value={warranty.endDate} onChange={(endDate) => onPatch({ endDate })} error={errors.endDate} />
          <RegistrationTextField name={`${prefix}-reference`} label="Warranty Reference" maxLength={250} value={warranty.reference} onChange={(event) => onPatch({ reference: event.target.value })} error={errors.reference} />
          <RegistrationTextField name={`${prefix}-status`} label="Warranty Status" maxLength={100} value={warranty.status} onChange={(event) => onPatch({ status: event.target.value })} error={errors.status} hint="Optional text describing this warranty; it does not select Current." />
          <div className="sm:col-span-2">
            <RegistrationField name={`${prefix}-coverage`} label="Coverage Note" error={errors.coverageNote} hint={`${warranty.coverageNote.length}/5000 characters`}>
              <Textarea id={`registration-${prefix}-coverage`} rows={3} maxLength={5000} value={warranty.coverageNote} aria-invalid={Boolean(errors.coverageNote)} aria-describedby={`registration-${prefix}-coverage-hint${errors.coverageNote ? ` registration-${prefix}-coverage-error` : ""}`} onChange={(event) => onPatch({ coverageNote: event.target.value })} />
            </RegistrationField>
          </div>
          <div className="sm:col-span-2">
            <RegistrationDocuments target={warranty.clientId} label={`Documents for warranty ${index + 1}`} hasSelections={warranty.hasDocumentSelections} documents={documents} rules={rules} />
          </div>
        </div>
      </details>
    </section>
  );
}
