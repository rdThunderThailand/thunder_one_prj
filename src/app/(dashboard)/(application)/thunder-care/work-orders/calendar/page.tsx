import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarPage } from "@/features/thunder-care/work-orders";

// Technician — "Calendar" (requirement doc §2.4): click a day to see that
// day's work orders and details.
export default function CalendarRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Calendar" subtitle="Work orders by day." />
      <CalendarPage />
    </div>
  );
}
