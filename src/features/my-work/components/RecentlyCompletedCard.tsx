import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircleIcon } from "@/components/ui/icons";
import { formatDate, type CompletedItem } from "../work-items";

// Only reviews this user made themselves (partner applications whose
// `actor_id` is them) — the one Core source that records who finished what.
export function RecentlyCompletedCard({ completed }: { completed: CompletedItem[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recently Completed
      </h2>
      {completed.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="Nothing completed yet"
          detail="Work you finish will show here."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {completed.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-t1-gray-400">{formatDate(item.completedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
