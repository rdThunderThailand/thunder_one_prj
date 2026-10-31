import { EditIcon, FileTextIcon, GridIcon, LocationIcon, ShieldIcon, ClipboardIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { RegistrationDraft } from "../../domain/registration-draft";
import { locationPath } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { registrationInitialStatus } from "../../domain/registration-initial-state";
import { registrationCategoryPath } from "../../domain/registration-categories";
import { registrationCustodyLabel } from "../../domain/registration-reference-choices";
import type { RegistrationDocumentGroups } from "../../hooks/use-registration-documents";

export function RegistrationReviewStep({ draft, options, onEdit, photoCount, needsPhotoReselection, documentGroups, locked = false, verifiedFiles = [] }: {
  draft: RegistrationDraft; options: RegistrationOptions; onEdit: (step: number) => void;
  photoCount: number; needsPhotoReselection: boolean;
  documentGroups: RegistrationDocumentGroups;
  locked?: boolean; verifiedFiles?: { localId: string; filename: string }[];
}) {
  const custody = registrationCustodyLabel(draft, options);
  function documentSummary(target: string, hadSelections: boolean): string {
    const files = documentGroups[target]?.files ?? [];
    const selectedIds = target === "asset" ? draft.documentSelectionIds : draft.warranties.find((warranty) => warranty.clientId === target)?.documentSelectionIds ?? [];
    const verified = verifiedFiles.filter((file) => selectedIds.includes(file.localId));
    if (verified.length === selectedIds.length && verified.length) return `${verified.map((file) => file.filename).join(", ")} — verified`;
    if (files.length) return `${files.map((document) => document.file.name).join(", ")} — local selection`;
    return hadSelections ? "Please reselect documents in Step 4" : "Not provided (optional)";
  }
  const warrantyGroups = draft.warranties.map((warranty, index) => ({
    title: `Warranty ${index + 1}${warranty.isCurrent ? " · Current" : ""}`, step: 3, twoColumns: true,
    rows: [
      ["Warranty Provider", warranty.provider], ["Warranty Type", warranty.type],
      ["Warranty Start Date", warranty.startDate], ["Warranty End Date", warranty.endDate],
      ["Warranty Reference", warranty.reference], ["Warranty Status", warranty.status],
      ["Coverage Note", warranty.coverageNote], ["Current warranty", warranty.isCurrent ? "Yes" : "No"],
      ["Documents", documentSummary(warranty.clientId, warranty.hasDocumentSelections)],
    ] as [string, string][],
  }));
  const groups: { title: string; step: number; twoColumns?: boolean; rows: [string, string][] }[] = [
    { title: "Basic Information", step: 0, rows: [
      ["Asset Name", draft.name],
      ["Asset Tag", draft.tagMode === "automatic" ? "Generated on creation" : draft.assetCode],
      ["Description", draft.description],
      ["Initial status", registrationInitialStatus(draft, options)],
      ["Condition", draft.condition],
      ["Asset Photos", needsPhotoReselection ? "Please reselect photos in Step 1" : draft.photoSelectionIds.length && draft.photoSelectionIds.every((id) => verifiedFiles.some((file) => file.localId === id)) ? `${draft.photoSelectionIds.length} verified` : photoCount ? `${photoCount} selected locally` : "Not provided (optional)"],
    ] },
    { title: "Category & Specification", step: 1, twoColumns: true, rows: [["Category", registrationCategoryPath(draft.categoryId, options.categories)], ["Serial Number", draft.serialNumber]] },
    { title: "Location & Ownership", step: 2, rows: [
      ["Location", locationPath(draft.locationId, options)],
      ["Custody target type", draft.custodyType === "none" ? "Unassigned" : draft.custodyType === "person" ? "Person" : "Organizational Unit"],
      ["Custodian", custody],
    ] },
    { title: "Acquisition & Warranty", step: 3, rows: [
      ["Acquisition Date", draft.purchaseDate], ["Warranties", draft.warranties.length ? `${draft.warranties.length} records` : "Not provided (optional)"],
    ] },
    { title: "Additional information", step: 3, rows: [["Asset Notes", draft.notes], ["Asset documents", documentSummary("asset", draft.hasDocumentSelections)]] },
  ];

  return (
    <section className="rounded-card border border-border bg-card p-4" aria-label="Review asset information">
      <h2 className="text-sm font-semibold">Review asset information</h2>
      {groups.map((group, index) => {
        const Icon = [FileTextIcon, GridIcon, LocationIcon, ShieldIcon, ClipboardIcon][index];
        return (
          <section key={group.title} className="space-y-3 border-b border-border py-4 last:border-b-0">
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
            <ReviewRows rows={group.rows} twoColumns={group.twoColumns} />
            {group.title === "Acquisition & Warranty" && warrantyGroups.map((warranty) => (
              <section key={warranty.title} className="space-y-3 border-t border-border pt-3">
                <h4 className="text-xs font-medium">{warranty.title}</h4>
                <ReviewRows rows={warranty.rows} twoColumns />
              </section>
            ))}
          </section>
        );
      })}
    </section>
  );
}

function ReviewRows({ rows, twoColumns }: { rows: [string, string][]; twoColumns?: boolean }) {
  return (
    <dl className={`grid gap-x-6 gap-y-3 text-xs ${twoColumns ? "sm:grid-cols-2" : ""}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap break-words sm:col-span-2">{value.trim() || "Not specified"}</dd>
        </div>
      ))}
    </dl>
  );
}
