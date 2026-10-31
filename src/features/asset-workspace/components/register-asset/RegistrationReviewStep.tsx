import { EditIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { RegistrationDraft } from "../../domain/registration-draft";
import { locationPath } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export function RegistrationReviewStep({ draft, options, onEdit }: { draft: RegistrationDraft; options: RegistrationOptions; onEdit: (step: number) => void }) {
  const category = options.categories.find((item) => item.id === draft.categoryId);
  const targets = draft.custodyType === "person" ? options.persons : options.orgUnits;
  const custody = draft.custodyType === "none" ? "Unassigned" : targets.find((item) => item.id === draft.custodyId)?.name || draft.custodyId;
  const warrantyRows: [string, string][] = draft.warrantyEnabled ? [
    ["Warranty Provider", draft.warrantyProvider],
    ["Warranty Type", draft.warrantyType],
    ["Warranty Start Date", draft.warrantyStart],
    ["Warranty Period", draft.warrantyYears ? `${draft.warrantyYears} ${Number(draft.warrantyYears) === 1 ? "year" : "years"}` : ""],
    ["Warranty End Date", draft.warrantyEnd],
    ["Current warranty", draft.warrantyCurrent ? "Yes" : "No"],
    ["Warranty Reference", draft.warrantyReference],
    ["Warranty Terms", draft.warrantyTerms],
  ] : [];
  const groups: { title: string; step: number; rows: [string, string][] }[] = [
    { title: "Basic Information", step: 0, rows: [
      ["Asset Name", draft.name],
      ["Asset Tag", draft.tagMode === "automatic" ? "Generated on creation" : draft.assetCode],
      ["Initial status", draft.custodyType === "none" ? "Available" : "Assigned"],
      ["Condition", draft.condition],
    ] },
    { title: "Category & Specification", step: 1, rows: [["Category", category?.name || ""], ["Serial Number", draft.serialNumber]] },
    { title: "Location & Ownership", step: 2, rows: [
      ["Location", locationPath(draft.locationId, options)],
      ["Custody target type", draft.custodyType === "none" ? "Unassigned" : draft.custodyType === "person" ? "Person" : "Organizational Unit"],
      ["Custodian", custody],
    ] },
    { title: "Purchase & Warranty", step: 3, rows: [
      ["Acquisition Date", draft.purchaseDate], ["Warranty", draft.warrantyEnabled ? "Included" : "Not included"], ...warrantyRows,
    ] },
    { title: "Additional information", step: 3, rows: [["Asset Notes", draft.notes], ["Photos / attachments", "Not available in this version"]] },
  ];

  return (
    <section className="rounded-card border border-border bg-card p-4" aria-label="Review asset information">
      <h2 className="text-sm font-semibold">Review asset information</h2>
      {groups.map((group) => (
        <section key={group.title} className="space-y-3 border-b border-border py-4 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold">{group.title}</h3>
            <Button variant="outline" size="sm" aria-label={`Edit ${group.title}`} onClick={() => onEdit(group.step)}>
              <EditIcon className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
          <dl className={`grid gap-x-6 gap-y-3 text-xs ${group.step === 1 || group.title === "Purchase & Warranty" ? "sm:grid-cols-2" : ""}`}>
            {group.rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap break-words sm:col-span-2">{value.trim() || "Not specified"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </section>
  );
}
