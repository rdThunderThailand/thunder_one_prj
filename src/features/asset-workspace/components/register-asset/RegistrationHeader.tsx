import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { REGISTRATION_STEPS } from "../../domain/registration-draft";
import { RegistrationBreadcrumb } from "./RegistrationBreadcrumb";

const DESCRIPTIONS = [
  "Asset details",
  "Category and serial number",
  "Where and who",
  "Acquisition details",
  "Check and create",
];

export function RegistrationHeader({ step }: { step: number }) {
  return (
    <header className="min-w-0 shrink-0 space-y-3 pb-1">
      <RegistrationBreadcrumb current="Single Asset" />
      <PageHeader
        title="Register Asset"
        subtitle={step === 4
          ? "Review all information before creating the asset. You can edit any section."
          : "Add a new asset to your organization. Complete the information below."}
      />
      <WizardSteps
        steps={REGISTRATION_STEPS}
        descriptions={DESCRIPTIONS}
        currentIndex={step}
        variant="detailed"
      />
    </header>
  );
}
