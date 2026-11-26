import { Skeleton } from "@/components/ui/Skeleton";
import { ProfileAssignmentEventsTable } from "./ProfileAssignmentEventsTable";

export function ProfileAssignmentEventsLoading({ history }: { history: boolean }) {
  return (
    <div role="status" aria-label="Loading assignment history…" className="motion-reduce:[&_*]:animate-none">
      <ProfileAssignmentEventsTable history={history} loading />
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Skeleton className="h-4 w-48 max-w-full" />
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="size-8" />)}
        </div>
      </div>
    </div>
  );
}
