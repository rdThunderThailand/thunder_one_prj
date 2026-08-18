import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

// Thunder Care — "Service Operations" (requirement doc §4.6). Placeholder route —
// wires to a real feature (work queue, SLA tracking, customer health) once
// Sprint 3+/7+ is built.
export default function ServiceOpsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customer Health" subtitle="Work queue, SLA status, and customer health." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Not built yet — see requirement doc §4.6 (Thunder Care).
      </Card>
    </div>
  );
}
