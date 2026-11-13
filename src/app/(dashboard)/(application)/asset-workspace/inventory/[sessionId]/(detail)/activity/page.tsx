import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/features/asset-workspace/components/states/states";

// Session Activity tab: slice I4 (checklist §1).
export default function SessionActivityPage() {
  return (
    <Card className="p-5">
      <EmptyState
        title="Not available yet"
        body="Activity for this session appears here in a later release."
      />
    </Card>
  );
}
