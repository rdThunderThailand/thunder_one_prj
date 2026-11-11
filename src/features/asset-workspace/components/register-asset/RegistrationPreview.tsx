import { Card } from "@/components/ui/Card";
import Image from "next/image";
import { BoxIcon, EditIcon, CheckIcon, InfoIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { StatusBadge, ConditionBadge } from "../StatusBadges";
import { REGISTRATION_STEPS, type RegistrationDraft } from "../../domain/registration-draft";
import { locationPath, registrationErrors } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { registrationInitialStatus } from "../../domain/registration-initial-state";
import type { RegistrationPhoto } from "../../hooks/use-registration-photos";
import { selectedReference } from "../../domain/registration-references";
import { registrationCategoryPath } from "../../domain/registration-categories";
import { registrationCustodyLabel } from "../../domain/registration-reference-choices";
import { RegistrationHelp } from "./RegistrationFields";
import { cn } from "@/lib/utils";

export function RegistrationPreview({ draft, options, step, reviewed, onEdit, photo, needsPhotoReselection, locked = false, verifiedPhoto = false }: {
  draft: RegistrationDraft; options: RegistrationOptions; step: number; reviewed: boolean; onEdit: (step: number) => void;
  photo?: RegistrationPhoto; needsPhotoReselection: boolean; locked?: boolean; verifiedPhoto?: boolean;
}) {
  const category = selectedReference(draft, "categories");
  const categoryPath = registrationCategoryPath(draft.categoryId, draft.selectedReferences.categories);
  const custody = registrationCustodyLabel(draft);
  const detailedPreview = step >= 1;
  const acquisitionSummary = `${draft.purchaseDate || "Acquisition date optional"} · ${draft.warranties.length ? `${draft.warranties.length} warranties` : "No warranties"}`;
  const summaries = [draft.name || "Not entered", categoryPath || "Not selected", locationPath(draft.locationId, draft) || "Not selected", acquisitionSummary, step === 4 ? "Reviewing information" : "Not completed"];
  const checklist = step === 4 ? [...REGISTRATION_STEPS.slice(0, 4), "Additional information"] : REGISTRATION_STEPS;
  if (step === 4) summaries[4] = draft.notes || draft.hasDocumentSelections ? "Notes and documents reviewed" : "Optional information not provided";

  return (
    <aside className="min-w-0 space-y-3" aria-label="Asset preview">
      <Card className="space-y-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{step === 4 ? "Asset preview" : "Live preview"}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Check how the asset information will look.
          </p>
        </div>
        <div className={!photo || step === 0 ? "flex items-start gap-3" : "space-y-3"}>
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted",
              !photo ? "h-12 w-12" : step === 0 ? "h-24 w-24" : "aspect-video max-h-48 w-full",
              detailedPreview && photo && "max-h-none",
            )}
          >
            {photo ? (
              <Image
                src={photo.previewUrl}
                alt={`Local preview of ${draft.name.trim() || "new asset"}`}
                fill
                unoptimized
                sizes={step === 0 ? "96px" : detailedPreview ? "(max-width: 1023px) 100vw, 36vw" : "352px"}
                className="object-contain"
              />
            ) : (
              <BoxIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={registrationInitialStatus(draft, options)} />
              <ConditionBadge condition={draft.condition} />
            </div>
            <h3 className="break-words text-sm font-semibold text-foreground">{draft.name.trim() || "New asset"}</h3>
            <p className="break-words text-xs text-muted-foreground">{draft.tagMode === "automatic" ? `${options.tagGeneration.format || "Asset Tag"} · Assigned on creation` : `Asset Tag: ${draft.assetCode || "Not entered"}`}</p>
            {category && <span className="inline-block max-w-full break-words rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground" title={categoryPath}>{category.name}</span>}
            {categoryPath && categoryPath !== category?.name && (
              <p className={cn("break-words text-muted-foreground", detailedPreview ? "text-xs leading-relaxed" : "text-2xs")}>
                {categoryPath}
              </p>
            )}
          </div>
        </div>
        {(photo || needsPhotoReselection || verifiedPhoto) && (
          <p className="text-xs leading-relaxed text-muted-foreground" role="status">
            {needsPhotoReselection ? "Some photos could not be restored. Reselect or remove them in Step 1." : verifiedPhoto ? "Verified photo upload retained for this registration." : "Local preview · not uploaded"}
          </p>
        )}
        {(step !== 0 || draft.locationId || draft.serialNumber) && (
          <dl className={cn("space-y-1 text-xs", detailedPreview && "space-y-2 border-t border-border pt-3 leading-relaxed")}>
            {[["Location", locationPath(draft.locationId, draft) || "Not selected"], ["Custody", custody], ["Serial Number", draft.serialNumber || "Not entered"]].map(([label, value]) => (
              <div key={label} className="grid grid-cols-3 gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="col-span-2 break-words text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
      {step === 0 ? (
        <section className="space-y-2 rounded-card bg-accent p-4 text-xs leading-relaxed text-foreground" aria-label="Quick tips">
          <h2 className="flex items-center gap-2 font-semibold text-accent-foreground">
            <InfoIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
            Quick tips
          </h2>
          <p>Use a unique tag or generate it on creation. Photos are optional.</p>
          <RegistrationHelp>
            <p>Status follows initial custody selected in Step 3.</p>
            <p>Keep browser storage available to restore selected files after refresh.</p>
          </RegistrationHelp>
        </section>
      ) : (
        <Card role="region" className="space-y-2 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4" aria-label="Registration checklist">
          <h2 className="text-sm font-semibold">{step === 4 ? "Checklist" : "Your progress"}</h2>
          {checklist.map((label, index) => {
            const complete = step === 4 && index === 4 || index < 4 && (reviewed || index < step) && Object.keys(registrationErrors(draft, options, index)).length === 0;
            const current = step !== 4 && index === step;
            return (
              <div
                key={label}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-start gap-2 rounded-control p-2",
                  detailedPreview && "gap-3 p-3",
                  current && (detailedPreview ? "bg-accent" : "bg-primary/5"),
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    step === 4 && complete ? "bg-success-muted text-success"
                      : complete || current ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    detailedPreview && "size-8 font-semibold",
                  )}
                >
                  {complete ? <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className={cn("min-w-0 flex-1 text-xs", detailedPreview && "leading-relaxed")}>
                  <p className={cn("font-medium", detailedPreview && "font-semibold", current && (detailedPreview ? "text-accent-foreground" : "text-primary"))}>
                    {label}
                  </p>
                  <p className={cn("mt-1 break-words text-muted-foreground", !detailedPreview && "line-clamp-2")} title={summaries[index]}>
                    {summaries[index]}
                  </p>
                </div>
                {(index < 4 || step === 4) && (reviewed || complete) && !current && (
                  <Button
                    variant="ghost"
                    size={detailedPreview ? "sm" : "icon-sm"}
                    className={detailedPreview ? "text-accent-foreground max-sm:h-10" : undefined}
                    disabled={locked}
                    aria-label={`Edit ${label} from preview`}
                    onClick={() => onEdit(Math.min(index, 3))}
                  >
                    <EditIcon aria-hidden="true" className="h-3.5 w-3.5" />
                    {detailedPreview && "Edit"}
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </aside>
  );
}
