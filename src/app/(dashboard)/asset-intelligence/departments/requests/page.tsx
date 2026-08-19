import { PageHeader } from "@/components/layout/PageHeader";
import { RequestsPage } from "@/features/ai-departments";

// Department Manager — "Requests" (requirement doc DM-03): approve/reject
// asset requests from employees.
export default function RequestsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Requests" subtitle="Approve or reject asset requests from your team." />
      <RequestsPage />
    </div>
  );
}
