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
  const currentMissing = draft.warranties.length > 0 && draft.warranties.filter((warranty) => warranty.isCurrent).length !== 1;
  function update(id: string, changes: Partial<WarrantyDraft>) {
    patch({ warranties: draft.warranties.map((warranty) => warranty.clientId === id ? { ...warranty, ...changes } : warranty) });
  }
  function remove(id: string) {
    documents.forget(id);
    patch({ warranties: draft.warranties.filter((warranty) => warranty.clientId !== id) });
    setPendingRemoval(null);
  }
  return (
    <RegistrationSection title="Warranty information" icon={ShieldIcon} description="Optional warranty records. When records are added, explicitly choose exactly one Current warranty.">
      {draft.warranties.length === 0 && <p className="text-xs text-muted-foreground">No warranties added. You can continue without a warranty.</p>}
      {draft.savedWarranty && <p className="text-xs text-muted-foreground">Your previously excluded warranty details have been kept and will be restored when you add a warranty.</p>}
      {errors.warranties && <p id="registration-warranties-error" role="alert" className="text-xs text-error">{errors.warranties}</p>}
      <fieldset className="space-y-3" tabIndex={-1} aria-invalid={Boolean(errors.warranties) && currentMissing} aria-describedby={errors.warranties ? "registration-warranties-error" : undefined}>
        <legend className="sr-only">Warranty records and Current selection</legend>
        {draft.warranties.map((warranty, index) => (
          <RegistrationWarrantyPanel
            key={warranty.clientId} warranty={warranty} index={index}
            errors={errors.warranties ? warrantyErrors(warranty) : {}} currentMissing={Boolean(errors.warranties) && currentMissing}
            documents={documents} rules={options.documentUpload}
            onPatch={(changes) => update(warranty.clientId, changes)}
            onCurrent={() => patch({ warranties: draft.warranties.map((row) => ({ ...row, isCurrent: row.clientId === warranty.clientId })) })}
            onRemove={() => {
              if (warrantyHasInformation(warranty) || documents.groups[warranty.clientId]?.files.length) setPendingRemoval(warranty.clientId);
              else remove(warranty.clientId);
            }}
          />
        ))}
      </fieldset>
      <Button variant="outline" size="sm" onClick={() => patch({ warranties: [...draft.warranties, draft.savedWarranty ?? newWarranty()], savedWarranty: null })}>
        <PlusIcon className="h-4 w-4" />
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
