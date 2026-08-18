import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

// Technician — "My Work" (requirement doc §4.4). Placeholder route — wires to a
// real feature (calendar, work order list, Scan QR) once Sprint 3+ is built.
export default function WorkOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Work" subtitle="Today's schedule and assigned work orders." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Not built yet — see requirement doc §4.4 (Technician).
      </Card>
    </div>
  );
}
