import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ChevronRightIcon } from "@/components/ui/icons";

const BREADCRUMBS = [
  { label: "Home", href: "/" },
  { label: "Assets", href: "/asset-workspace/assets" },
  { label: "Register Asset", href: "/asset-workspace/assets/register" },
];

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
        <nav aria-label="Breadcrumb" className="text-2xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            {BREADCRUMBS.map(({ label, href }) => (
              <li key={href} className="flex items-center gap-1">
                <Link
                  href={href}
                  className="inline-flex min-h-8 items-center rounded-control underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {label}
                </Link>
                <ChevronRightIcon className="h-3 w-3" />
              </li>
            ))}
            <li aria-current="page" className="font-semibold text-foreground">
              Bulk Assets
            </li>
          </ol>
        </nav>
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
