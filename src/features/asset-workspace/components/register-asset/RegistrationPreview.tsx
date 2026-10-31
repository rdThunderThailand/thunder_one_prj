import { BoxIcon, EditIcon, CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { StatusBadge, ConditionBadge } from "../StatusBadges";
import { REGISTRATION_STEPS, type RegistrationDraft } from "../../domain/registration-draft";
import { locationPath, registrationErrors } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export function RegistrationPreview({ draft, options, step, reviewed, onEdit }: {
  draft: RegistrationDraft; options: RegistrationOptions; step: number; reviewed: boolean; onEdit: (step: number) => void;
}) {
  const category = options.categories.find((item) => item.id === draft.categoryId);
  const targets = draft.custodyType === "person" ? options.persons : options.orgUnits;
  const target = targets.find((item) => item.id === draft.custodyId);
  const custody = draft.custodyType === "none" ? "Unassigned" : target ? target.name || target.id : "Choose a custody target";
  const summaries = [draft.name || "Not entered", category?.name || "Not selected", locationPath(draft.locationId, options) || "Not selected", draft.purchaseDate || "Optional details"];

  return (
    <aside className="min-w-0 space-y-3" aria-label="Asset preview">
      <section className="space-y-3 rounded-card border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold">{step === 4 ? "Asset preview" : "Live preview"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">A preview of the information entered so far.</p>
        </div>
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-control bg-muted" aria-label="Asset image unavailable">
          <BoxIcon className="h-12 w-12 text-muted-foreground" />
          {step === 0 && <Button variant="outline" size="sm" disabled aria-describedby="registration-photos-reason">Add Photos</Button>}
        </div>
        <p id="registration-photos-reason" className="text-xs text-muted-foreground">Asset photos are not available in this version.</p>
        <h3 className="break-words text-base font-semibold">{draft.name.trim() || "New asset"}</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={draft.custodyType === "none" ? "Available" : "Assigned"} />
          <ConditionBadge condition={draft.condition} />
        </div>
        <p className="break-words text-xs text-muted-foreground">{draft.tagMode === "automatic" ? "Asset Tag: Generated on creation" : `Asset Tag: ${draft.assetCode || "Not entered"}`}</p>
        {category && <span className="inline-block rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">{category.name}</span>}
        <dl className="space-y-2 text-xs">
          {[["Location", locationPath(draft.locationId, options) || "Not selected"], ["Custody", custody], ["Serial Number", draft.serialNumber || "Not entered"]].map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-3 rounded-card border border-border bg-card p-4" aria-label="Registration checklist">
        <h2 className="text-sm font-semibold">{step === 4 ? "Checklist" : "Your progress"}</h2>
        {REGISTRATION_STEPS.slice(0, 4).map((label, index) => {
          const complete = (reviewed || index < step) && Object.keys(registrationErrors(draft, options, index)).length === 0;
          return (
            <div key={label} className={`flex items-start gap-2 rounded-control p-2 ${index === step ? "bg-primary/5" : ""}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {complete ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-medium">{label}</p>
                <p className="mt-1 break-words text-muted-foreground">{summaries[index]}</p>
              </div>
              {reviewed && index !== step && (
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label} from preview`} onClick={() => onEdit(index)}>
                  <EditIcon className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </section>
    </aside>
  );
}
