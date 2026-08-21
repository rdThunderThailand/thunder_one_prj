import { PageHeader } from "@/components/layout/PageHeader";
import { ApprovalsPage } from "@/features/mission-control";

// CEO — "Approvals" (requirement doc CEO-04).
export default function CeoApprovalsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approvals" subtitle="Recommendations awaiting your decision." />
      <ApprovalsPage />
    </div>
  );
}
