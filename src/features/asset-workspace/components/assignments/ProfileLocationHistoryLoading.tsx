import { Skeleton } from "@/components/ui/Skeleton";
import { ProfileAssignmentEventsTable } from "./ProfileAssignmentEventsTable";

export function ProfileLocationHistoryLoading() {
  return (
    <div role="status" aria-label="Loading location history…" className="motion-reduce:[&_*]:animate-none">
      <ProfileAssignmentEventsTable variant="location" locations={new Map()} loading />
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Skeleton className="h-4 w-44 max-w-full" />
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="size-8" />)}
        </div>
      </div>
    </div>
  );
}

export function ProfileLocationDetailLoading() {
  return (
    <div role="status" aria-label="Loading location change…" className="space-y-4 motion-reduce:[&_*]:animate-none">
      <div aria-hidden="true" className="grid grid-cols-3 gap-3 rounded-control bg-accent/50 p-3">
        {[0, 1, 2].map((index) => <Skeleton key={index} className="h-9 w-full" />)}
      </div>
      <div aria-hidden="true" className="grid gap-2 @xs/location-panel:grid-cols-2 @xs/location-panel:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
