import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardIcon } from "@/components/ui/icons";

// No Core source exists for this card — an empty state instead of the old
// placeholder list.
export function RecentDocumentsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Documents</h2>
      <EmptyState
        icon={ClipboardIcon}
        title="No recent documents"
        detail="Documents you open will show here."
        compact
      />
    </Card>
  );
}
