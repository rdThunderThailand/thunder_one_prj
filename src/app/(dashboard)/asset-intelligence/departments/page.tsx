import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

// Department Manager — "My Department" (requirement doc §4.3). Placeholder route —
// wires to a real feature once Sprint 5+ (Department & Onboarding) is built.
export default function DepartmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Department" subtitle="Assets and requests for your department." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Not built yet — see requirement doc §4.3 (Department Manager).
      </Card>
    </div>
  );
}
