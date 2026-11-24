import { PageHeader } from "@/components/layout/PageHeader";
import { ApprovalsPage } from "@/features/asset-intelligence/departments";

// Department Manager — "Approvals" (requirement doc DM-01): acknowledge
// assets transferred in from Asset Manager.
export default function ApprovalsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approvals" subtitle="Assets transferred in, awaiting your acknowledgement." />
      <ApprovalsPage />
    </div>
  );
}
