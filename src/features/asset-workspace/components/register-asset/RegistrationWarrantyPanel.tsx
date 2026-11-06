import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Textarea } from "@/components/ui/lovable/textarea";
import { ChevronDownIcon, TrashIcon } from "@/components/ui/icons";
import type { WarrantyDraft, WarrantyErrors } from "../../domain/registration-warranties";
import type { RegistrationDocuments as DocumentsController } from "../../hooks/use-registration-documents";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { RegistrationErrors } from "../../domain/registration-validation";
import { RegistrationField, RegistrationTextField } from "./RegistrationFields";
import { RegistrationDateField } from "./RegistrationDateField";
import { RegistrationDocuments } from "./RegistrationDocuments";
import { cn } from "@/lib/utils";

export function RegistrationWarrantyPanel({ warranty, index, errors, validationErrors, currentMissing, documents, rules, open, onOpenChange, onPatch, onCurrent, onRemove }: {
  warranty: WarrantyDraft; index: number; errors: WarrantyErrors; currentMissing: boolean;
  documents: DocumentsController; rules: RegistrationOptions["documentUpload"];
  open: boolean; onOpenChange: (open: boolean) => void;
  validationErrors: RegistrationErrors;
  onPatch: (changes: Partial<WarrantyDraft>) => void; onCurrent: () => void; onRemove: () => void;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const prefix = `warranty-${warranty.clientId}`;
  const hasErrors = Object.keys(errors).length > 0;
  const missingDocuments = documents.missingIds(warranty.clientId).length;
  const documentError = documents.groups[warranty.clientId]?.errors.join(" ") || "";
  useLayoutEffect(() => {
    if ((hasErrors || missingDocuments > 0 || documentError) && details.current) details.current.open = true;
  }, [hasErrors, missingDocuments, documentError, validationErrors]);
  return (
    <section
      aria-label={`Warranty ${index + 1}`}
      className={cn("@container/warranty min-w-0 space-y-3 rounded-control border border-border p-4", warranty.isCurrent && "border-primary/40")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-foreground">Warranty {index + 1}</h3>
        <div className="flex items-center gap-3">
          <label className={cn("flex min-h-8 cursor-pointer items-center gap-2 text-xs font-medium max-sm:min-h-10", warranty.isCurrent && "text-accent-foreground")}>
            <input
              type="radio"
              name="registration-current-warranty"
              className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              checked={warranty.isCurrent}
              onChange={onCurrent}
              aria-label={`Set warranty ${index + 1} as Current`}
              aria-describedby={currentMissing ? "registration-warranties-error" : undefined}
            />
            Current
          </label>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:text-error max-sm:size-10"
            aria-label={`Remove warranty ${index + 1}`}
            onClick={onRemove}
          >
            <TrashIcon aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <details ref={details} open={open} className="group" onToggle={(event) => {
        if (event.currentTarget.open !== open) onOpenChange(event.currentTarget.open);
      }}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-control p-2 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 space-y-1 leading-relaxed">
            <span className="block break-words font-semibold text-foreground">{warranty.provider.trim() || "New warranty"}</span>
            <span className="block break-words font-normal text-muted-foreground">
              {warranty.startDate || "No start date"} – {warranty.endDate || "No end date"} · {warranty.documentSelectionIds.length} documents
            </span>
          </span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="mt-4 grid items-start gap-4 @min-lg/warranty:grid-cols-2">
          <RegistrationTextField
            name={`${prefix}-provider`}
            label="Warranty Provider"
            required
            className="max-sm:h-10"
            maxLength={500}
            value={warranty.provider}
            onChange={(event) => onPatch({ provider: event.target.value })}
            error={errors.provider}
          />
          <RegistrationTextField
            name={`${prefix}-type`}
            label="Warranty Type"
            className="max-sm:h-10"
            maxLength={250}
            value={warranty.type}
            onChange={(event) => onPatch({ type: event.target.value })}
            error={errors.type}
          />
          <RegistrationDateField
            name={`${prefix}-start`}
            label="Warranty Start Date"
            value={warranty.startDate}
            onChange={(startDate) => onPatch({ startDate })}
            error={errors.startDate}
          />
          <RegistrationDateField
            name={`${prefix}-end`}
            label="Warranty End Date"
            value={warranty.endDate}
            onChange={(endDate) => onPatch({ endDate })}
            error={errors.endDate}
          />
          <RegistrationTextField
            name={`${prefix}-reference`}
            label="Warranty Reference"
            className="max-sm:h-10"
            maxLength={250}
            value={warranty.reference}
            onChange={(event) => onPatch({ reference: event.target.value })}
            error={errors.reference}
          />
          <RegistrationTextField
            name={`${prefix}-status`}
            label="Warranty Status"
            className="max-sm:h-10"
            maxLength={100}
            value={warranty.status}
            onChange={(event) => onPatch({ status: event.target.value })}
            error={errors.status}
            hint="Optional text describing this warranty; it does not select Current."
          />
          <div className="@min-lg/warranty:col-span-2">
            <RegistrationField name={`${prefix}-coverage`} label="Coverage Note" error={errors.coverageNote} hint={`${warranty.coverageNote.length}/5000 characters`}>
              <Textarea
                id={`registration-${prefix}-coverage`}
                rows={4}
                maxLength={5000}
                value={warranty.coverageNote}
                aria-invalid={Boolean(errors.coverageNote)}
                aria-describedby={`registration-${prefix}-coverage-hint${errors.coverageNote ? ` registration-${prefix}-coverage-error` : ""}`}
                onChange={(event) => onPatch({ coverageNote: event.target.value })}
              />
            </RegistrationField>
          </div>
          <div className="@min-lg/warranty:col-span-2">
            <RegistrationDocuments
              target={warranty.clientId}
              label={`Documents for warranty ${index + 1}`}
              hasSelections={warranty.hasDocumentSelections}
              documents={documents}
              rules={rules}
            />
          </div>
        </div>
      </details>
      {(hasErrors || missingDocuments > 0 || documentError) && (
        <p role="alert" className="text-xs text-error">
          {missingDocuments ? "Reselect or remove missing warranty documents." : documentError ? "Check the warranty document selection." : "Check the highlighted warranty fields."}
        </p>
      )}
    </section>
  );
}
