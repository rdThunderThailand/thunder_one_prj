import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/features/asset-workspace/components/states/states";

// Session Discrepancies tab: slice I3 (checklist §1). The list's Issues link lands here.
export default function SessionDiscrepanciesPage() {
  return (
    <Card className="p-5">
      <EmptyState
        title="Not available yet"
        body="Discrepancies for this session appear here in a later release."
      />
    </Card>
  );
}
