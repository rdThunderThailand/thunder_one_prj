import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { RegistrationBreadcrumb } from "../register-asset/RegistrationBreadcrumb";

const STEPS = [
  "Upload File",
  "Map & Validate",
  "Review & Confirm",
  "Complete",
];

const DESCRIPTIONS = [
  "Select or upload file",
  "Map columns and check data",
  "Review assets before registration",
  "View import result",
];

export function BulkImportHeader({
  step,
  tools,
}: {
  step: number | null;
  tools?: ReactNode;
}) {
  return (
    <header className="min-w-0 shrink-0 space-y-3 pb-1">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <RegistrationBreadcrumb current="Bulk Assets" />
        {tools}
      </div>
      <PageHeader
        title="Register Assets (Bulk)"
        subtitle="Register multiple assets using file import or template"
      />
      <WizardSteps
        steps={STEPS}
        descriptions={DESCRIPTIONS}
        currentIndex={step ?? -1}
        variant="detailed"
      />
      {step !== null && (
        <p className="text-xs text-muted-foreground sm:hidden" role="status">
          <span>Step {step + 1} of {STEPS.length}: </span>
          <span className="font-semibold text-foreground">{STEPS[step]}</span>
        </p>
      )}
    </header>
  );
}
