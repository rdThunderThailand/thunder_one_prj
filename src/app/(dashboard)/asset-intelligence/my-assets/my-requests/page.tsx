import { PageHeader } from "@/components/layout/PageHeader";
import { MyRequestsPage } from "@/features/ai-requests";

// Employee/User — "My Requests" (requirement doc EMP-03/04).
export default function MyRequestsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Requests" subtitle="Assets you've requested from your department." />
      <MyRequestsPage />
    </div>
  );
}
