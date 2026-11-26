import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";

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

export function BulkImportHeader({ step }: { step: number | null }) {
  return (
    <header className="min-w-0 shrink-0 space-y-3 pb-1">
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
