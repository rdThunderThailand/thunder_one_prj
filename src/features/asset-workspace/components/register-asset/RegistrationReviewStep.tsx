import { EditIcon, FileTextIcon, GridIcon, LocationIcon, ShieldIcon, ClipboardIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { RegistrationDraft } from "../../domain/registration-draft";
import { locationPath } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { registrationInitialStatus } from "../../domain/registration-initial-state";
import { registrationCategoryPath } from "../../domain/registration-categories";
import { registrationCustodyLabel } from "../../domain/registration-reference-choices";
import { selectedReference } from "../../domain/registration-references";
import type { RegistrationDocumentGroups } from "../../hooks/use-registration-documents";
import { RegistrationReviewRows, type RegistrationReviewRow } from "./RegistrationReviewRows";

export function RegistrationReviewStep({ draft, options, onEdit, photoCount, needsPhotoReselection, documentGroups, locked = false, verifiedFiles = [] }: {
  draft: RegistrationDraft; options: RegistrationOptions; onEdit: (step: number) => void;
  photoCount: number; needsPhotoReselection: boolean;
  documentGroups: RegistrationDocumentGroups;
  locked?: boolean; verifiedFiles?: { localId: string; filename: string }[];
}) {
  function documentRow(target: string, hadSelections: boolean): RegistrationReviewRow {
    const local = documentGroups[target]?.files ?? [];
    const ids = target === "asset" ? draft.documentSelectionIds
      : draft.warranties.find((warranty) => warranty.clientId === target)?.documentSelectionIds ?? [];
    const missing = ids.some((id) => !local.some((file) => file.id === id) && !verifiedFiles.some((file) => file.localId === id))
      || hadSelections && !ids.length;
    const names = ids.map((id) => verifiedFiles.find((file) => file.localId === id)?.filename
      ?? local.find((file) => file.id === id)?.file.name ?? "Missing document");
    const verified = ids.length > 0 && ids.every((id) => verifiedFiles.some((file) => file.localId === id));
    return { label: target === "asset" ? "Asset documents" : "Documents", long: true, warning: missing,
      value: missing ? `${names.join(", ")} · Reselect missing documents in Step 4 or remove their selections.`
        : names.length ? `${names.join(", ")} · ${verified ? "Verified" : "Local selection"}` : "" };
  }
  const allPhotosVerified = draft.photoSelectionIds.length > 0
    && draft.photoSelectionIds.every((id) => verifiedFiles.some((file) => file.localId === id));
  const warrantyGroups = draft.warranties.map((warranty, index) => ({
    id: warranty.clientId,
    title: `Warranty ${index + 1}${warranty.isCurrent ? " · Current" : ""}`,
    rows: [
      { label: "Warranty Provider", value: warranty.provider, required: true },
      { label: "Warranty Type", value: warranty.type },
      { label: "Warranty Start Date", value: warranty.startDate },
      { label: "Warranty End Date", value: warranty.endDate },
      { label: "Warranty Reference", value: warranty.reference },
      { label: "Warranty Status", value: warranty.status },
      { label: "Coverage Note", value: warranty.coverageNote, long: true },
      { label: "Current warranty", value: warranty.isCurrent ? "Yes" : "No", required: true },
      documentRow(warranty.clientId, warranty.hasDocumentSelections),
    ] satisfies RegistrationReviewRow[],
  }));
  const groups: { title: string; step: number; rows: RegistrationReviewRow[] }[] = [
    { title: "Basic Information", step: 0, rows: [
      { label: "Asset Name", value: draft.name, required: true },
      { label: "Asset Tag", value: draft.tagMode === "automatic" ? "Generated on creation" : draft.assetCode, required: true },
      { label: "Initial status", value: registrationInitialStatus(draft, options), required: true },
      { label: "Condition", value: draft.condition, required: true },
      { label: "Description", value: draft.description, long: true },
      { label: "Asset Photos", warning: needsPhotoReselection, value: needsPhotoReselection ? "Reselect missing photos in Step 1 or remove their selections."
        : allPhotosVerified ? `${draft.photoSelectionIds.length} verified` : photoCount ? `${photoCount} selected locally` : "" },
    ] },
    { title: "Category & Specification", step: 1, rows: [
      { label: "Category", value: registrationCategoryPath(draft.categoryId, draft.selectedReferences.categories), required: true },
      { label: "Serial Number", value: draft.serialNumber, required: selectedReference(draft, "categories")?.is_serial_required },
    ] },
    { title: "Location & Ownership", step: 2, rows: [
      { label: "Location", value: locationPath(draft.locationId, draft), required: true },
      { label: "Custody target type", value: draft.custodyType === "none" ? "Unassigned" : draft.custodyType === "person" ? "Person" : "Organizational Unit", required: true },
      { label: "Custodian", value: registrationCustodyLabel(draft), required: true },
    ] },
    { title: "Acquisition & Warranty", step: 3, rows: [
      { label: "Acquisition Date", value: draft.purchaseDate },
      { label: "Warranties", value: draft.warranties.length ? `${draft.warranties.length} records` : "" },
    ] },
    { title: "Additional information", step: 3, rows: [
      { label: "Asset Notes", value: draft.notes, long: true }, documentRow("asset", draft.hasDocumentSelections),
    ] },
  ];

  return (
    <section className="rounded-card border border-border bg-card p-4" aria-label="Review asset information">
      <h2 className="text-sm font-semibold">Review asset information</h2>
      {groups.map((group, index) => {
        const Icon = [FileTextIcon, GridIcon, LocationIcon, ShieldIcon, ClipboardIcon][index];
        return (
          <section key={group.title} className="space-y-2 border-b border-border py-3 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                {group.title}
              </h3>
              <Button variant="outline" size="sm" disabled={locked} aria-label={`Edit ${group.title}`} onClick={() => onEdit(group.step)}>
                <EditIcon className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            <RegistrationReviewRows rows={group.rows} />
            {group.title === "Acquisition & Warranty" && warrantyGroups.map((warranty) => (
              <section key={warranty.id} className="space-y-2 border-t border-border pt-3">
                <h4 className="text-xs font-medium">{warranty.title}</h4>
                <RegistrationReviewRows rows={warranty.rows} />
              </section>
            ))}
          </section>
        );
      })}
    </section>
  );
}
