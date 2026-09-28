import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarIcon } from "@/components/ui/icons";

// No calendar source exists in Core — an empty state instead of the old
// placeholder schedule.
export function ScheduleCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Today&apos;s Schedule
      </h2>
      <EmptyState
        icon={CalendarIcon}
        title="No calendar connected"
        detail="Your meetings and events will show here."
        compact
      />
    </Card>
  );
}
