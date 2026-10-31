import Image from "next/image";
import { BoxIcon, EditIcon, CheckIcon, InfoIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { StatusBadge, ConditionBadge } from "../StatusBadges";
import { REGISTRATION_STEPS, type RegistrationDraft } from "../../domain/registration-draft";
import { locationPath, registrationErrors } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { registrationInitialStatus } from "../../domain/registration-initial-state";
import type { RegistrationPhoto } from "../../hooks/use-registration-photos";
import { registrationCategoryPath } from "../../domain/registration-categories";
import { registrationCustodyLabel } from "../../domain/registration-reference-choices";

export function RegistrationPreview({ draft, options, step, reviewed, onEdit, photo, needsPhotoReselection, locked = false, verifiedPhoto = false }: {
  draft: RegistrationDraft; options: RegistrationOptions; step: number; reviewed: boolean; onEdit: (step: number) => void;
  photo?: RegistrationPhoto; needsPhotoReselection: boolean; locked?: boolean; verifiedPhoto?: boolean;
}) {
  const category = options.categories.find((item) => item.id === draft.categoryId);
  const categoryPath = registrationCategoryPath(draft.categoryId, options.categories);
  const custody = registrationCustodyLabel(draft, options);
  const acquisitionSummary = `${draft.purchaseDate || "Acquisition date optional"} · ${draft.warranties.length ? `${draft.warranties.length} warranties` : "No warranties"}`;
  const summaries = [draft.name || "Not entered", categoryPath || "Not selected", locationPath(draft.locationId, options) || "Not selected", acquisitionSummary, step === 4 ? "Reviewing information" : "Not completed"];
  const checklist = step === 4 ? [...REGISTRATION_STEPS.slice(0, 4), "Additional information"] : REGISTRATION_STEPS;
  if (step === 4) summaries[4] = draft.notes || draft.hasDocumentSelections ? "Notes and documents reviewed" : "Optional information not provided";

  return (
    <aside className="min-w-0 space-y-3" aria-label="Asset preview">
      <section className="space-y-3 rounded-card border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold">{step === 4 ? "Asset preview" : "Live preview"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Check how the asset information will look.</p>
        </div>
        <div className={step === 0 ? "flex items-start gap-3" : "space-y-3"}>
          <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted ${step === 0 ? "aspect-square w-1/3" : "aspect-video w-full"}`}>
            {photo ? (
              <Image src={photo.previewUrl} alt={`Local preview of ${draft.name.trim() || "new asset"}`} fill unoptimized sizes={step === 0 ? "160px" : "480px"} className="object-contain" />
            ) : (
              <BoxIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={registrationInitialStatus(draft, options)} />
              <ConditionBadge condition={draft.condition} />
            </div>
            <h3 className="break-words text-sm font-semibold">{draft.name.trim() || "New asset"}</h3>
            <p className="break-words text-xs text-muted-foreground">{draft.tagMode === "automatic" ? `${options.tagGeneration.format || "Asset Tag"} · Assigned on creation` : `Asset Tag: ${draft.assetCode || "Not entered"}`}</p>
            {category && <span className="inline-block max-w-full break-words rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground" title={categoryPath}>{category.name}</span>}
            {categoryPath && categoryPath !== category?.name && <p className="break-words text-2xs text-muted-foreground">{categoryPath}</p>}
          </div>
        </div>
        {(photo || needsPhotoReselection || verifiedPhoto) && (
          <p className="text-2xs text-muted-foreground" role="status">
            {needsPhotoReselection ? "Please reselect photos in Step 1. Files are not restored after refresh." : verifiedPhoto ? "Verified photo upload retained for this registration." : "Local preview · not uploaded"}
          </p>
        )}
        {(step !== 0 || draft.locationId || draft.serialNumber) && (
          <dl className="space-y-2 text-xs">
            {[["Location", locationPath(draft.locationId, options) || "Not selected"], ["Custody", custody], ["Serial Number", draft.serialNumber || "Not entered"]].map(([label, value]) => (
              <div key={label} className="grid grid-cols-3 gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="col-span-2 break-words text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      {step === 0 ? (
        <section className="space-y-2 rounded-control bg-info-muted p-3 text-xs text-info" aria-label="Quick tips">
          <h2 className="flex items-center gap-2 font-semibold">
            <InfoIcon className="h-4 w-4" />
            Quick tips
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Enter a unique Asset Tag or use automatic generation.</li>
            <li>Status follows initial custody selected in Step 3.</li>
            <li>Photos are optional. Reselect them after refresh.</li>
          </ul>
        </section>
      ) : (
        <section className="space-y-3 rounded-card border border-border bg-card p-4" aria-label="Registration checklist">
          <h2 className="text-sm font-semibold">{step === 4 ? "Checklist" : "Your progress"}</h2>
          {checklist.map((label, index) => {
            const complete = step === 4 && index === 4 || index < 4 && (reviewed || index < step) && Object.keys(registrationErrors(draft, options, index)).length === 0;
            const current = step !== 4 && index === step;
            return (
              <div key={label} className={`flex items-start gap-2 rounded-control p-2 ${current ? "bg-primary/5" : ""}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${step === 4 && complete ? "bg-success-muted text-success" : complete || current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {complete ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className={`font-medium ${current ? "text-primary" : ""}`}>{label}</p>
                  <p className="mt-1 break-words text-muted-foreground">{summaries[index]}</p>
                </div>
                {(index < 4 || step === 4) && (reviewed || complete) && !current && (
                  <Button variant="ghost" size="icon-sm" disabled={locked} aria-label={`Edit ${label} from preview`} onClick={() => onEdit(Math.min(index, 3))}>
                    <EditIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </section>
      )}
    </aside>
  );
}
