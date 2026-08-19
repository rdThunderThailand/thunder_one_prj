import { PageHeader } from "@/components/layout/PageHeader";
import { InsightsPage } from "@/features/ai-mission-control";

// CEO — "Insights" (requirement doc CEO-05).
export default function InsightsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Insights" subtitle="Trends and cross-department benchmarks." />
      <InsightsPage />
    </div>
  );
}
