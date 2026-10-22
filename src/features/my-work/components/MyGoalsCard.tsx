import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GaugeIcon } from "@/components/ui/icons";

// No Core source exists for this card — an empty state instead of the old
// placeholder list.
export function MyGoalsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-foreground">My Goals</h2>
      <EmptyState
        icon={GaugeIcon}
        title="No goals yet"
        detail="Goals assigned to you will show here."
        compact
      />
    </Card>
  );
}
