import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MegaphoneIcon } from "@/components/ui/icons";

// No announcements source exists in Core — an empty state instead of the
// old placeholder list.
export function AnnouncementsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Announcements</h2>
      <EmptyState
        icon={MegaphoneIcon}
        title="No announcements"
        detail="Company announcements will show here."
        compact
      />
    </Card>
  );
}
