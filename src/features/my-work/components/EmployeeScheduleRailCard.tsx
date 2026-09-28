import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons";

// No Core source exists for this card — an empty state instead of the old
// placeholder list.
export function EmployeeScheduleRailCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s Schedule</h2>
      <EmptyState
        icon={CalendarIcon}
        title="No calendar connected"
        detail="Your meetings and events will show here."
        compact
      />
    </Card>
  );
}
