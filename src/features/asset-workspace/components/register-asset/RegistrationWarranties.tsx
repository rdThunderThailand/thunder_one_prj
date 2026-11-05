import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon, ShieldIcon } from "@/components/ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import { newWarranty, warrantyErrors, warrantyHasInformation, type WarrantyDraft } from "../../domain/registration-warranties";
import type { RegistrationDocuments } from "../../hooks/use-registration-documents";
import { RegistrationSection, type RegistrationStepProps } from "./RegistrationFields";
import { RegistrationWarrantyPanel } from "./RegistrationWarrantyPanel";

export function RegistrationWarranties({ draft, options, errors, patch, documents }: RegistrationStepProps & { documents: RegistrationDocuments }) {
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => new Set(draft.warranties
    .filter((warranty) => Object.keys(warrantyErrors(warranty)).length > 0)
    .map((warranty) => warranty.clientId)));
  const currentMissing = draft.warranties.length > 0 && draft.warranties.filter((warranty) => warranty.isCurrent).length !== 1;
  function update(id: string, changes: Partial<WarrantyDraft>) {
    patch({ warranties: draft.warranties.map((warranty) => warranty.clientId === id ? { ...warranty, ...changes } : warranty) });
  }
  function remove(id: string) {
    documents.forget(id);
    patch({ warranties: draft.warranties.filter((warranty) => warranty.clientId !== id) });
    setPendingRemoval(null);
  }
  function addWarranty() {
    const warranty = draft.savedWarranty ?? newWarranty();
    // Keep incomplete records open; completed records remain available in their summaries.
    setExpanded(new Set([warranty.clientId, ...draft.warranties
      .filter((row) => Object.keys(warrantyErrors(row)).length > 0 || documents.missingIds(row.clientId).length > 0
        || Boolean(documents.groups[row.clientId]?.errors.length))
      .map((row) => row.clientId)]));
    patch({ warranties: [...draft.warranties, warranty], savedWarranty: null });
  }
  return (
    <RegistrationSection title="Warranty information" icon={ShieldIcon} description="Optional. Choose exactly one Current warranty when adding records.">
      {draft.warranties.length === 0 && (
        <p className="rounded-control bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
          No warranties added. You can continue without a warranty.
        </p>
      )}
      {draft.savedWarranty && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your previously excluded warranty details have been kept and will be restored when you add a warranty.
        </p>
      )}
      {errors.warranties && (
        <p id="registration-warranties-error" role="alert" className="text-xs text-error">
          {errors.warranties}
        </p>
      )}
      {draft.warranties.length > 0 && (
        <fieldset
          className="min-w-0 space-y-3 rounded-control focus-visible:outline-2 focus-visible:outline-ring"
          tabIndex={-1}
          aria-invalid={Boolean(errors.warranties) && currentMissing}
          aria-describedby={errors.warranties ? "registration-warranties-error" : undefined}
        >
          <legend className="sr-only">Warranty records and Current selection</legend>
          {draft.warranties.map((warranty, index) => (
            <RegistrationWarrantyPanel
              key={warranty.clientId} warranty={warranty} index={index}
              errors={errors.warranties ? warrantyErrors(warranty) : {}} currentMissing={Boolean(errors.warranties) && currentMissing}
              validationErrors={errors}
              documents={documents} rules={options.documentUpload}
              open={expanded.has(warranty.clientId)}
              onOpenChange={(open) => setExpanded((previous) => {
                const next = new Set(previous);
                if (open) next.add(warranty.clientId);
                else next.delete(warranty.clientId);
                return next;
              })}
              onPatch={(changes) => update(warranty.clientId, changes)}
              onCurrent={() => patch({ warranties: draft.warranties.map((row) => ({ ...row, isCurrent: row.clientId === warranty.clientId })) })}
              onRemove={() => {
                if (warrantyHasInformation(warranty) || documents.groups[warranty.clientId]?.files.length) setPendingRemoval(warranty.clientId);
                else remove(warranty.clientId);
              }}
            />
          ))}
        </fieldset>
      )}
      <Button variant="outline" size="sm" className="text-accent-foreground max-sm:h-10" onClick={addWarranty}>
        <PlusIcon aria-hidden="true" className="h-4 w-4" />
        Add warranty
      </Button>
      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this warranty?</AlertDialogTitle>
            <AlertDialogDescription>Its entered details and selected local documents will be removed from this draft. If it is Current, choose another Current warranty when records remain. No backend record will be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep warranty</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingRemoval) remove(pendingRemoval); }}>Remove warranty</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RegistrationSection>
  );
}
