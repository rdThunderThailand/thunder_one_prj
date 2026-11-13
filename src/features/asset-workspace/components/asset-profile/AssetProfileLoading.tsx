import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { ProfileAssignmentEventsLoading } from "../assignments/ProfileAssignmentEventsLoading";

function LoadingCard({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="space-y-3 p-4 motion-reduce:transition-none">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 py-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </Card>
  );
}

function SummaryLoading() {
  return (
    <Card className="@container/profile-section min-w-0 space-y-3 p-4 motion-reduce:transition-none">
      <div className="grid min-w-0 gap-x-6 @min-lg/profile-section:grid-cols-2">
        {[0, 1].map((column) => (
          <div key={column}>
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row} className="grid gap-1 py-2 @min-xs/profile-section:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] @min-xs/profile-section:gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className={column === 1 && row === 0 ? "h-8 w-full" : "h-4 w-full"} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProfilePhotoLoading() {
  return (
    <div role="status" aria-label="Loading asset photos" className="motion-reduce:[&_*]:animate-none">
      <div aria-hidden="true" className="space-y-2">
        <Skeleton className="h-44 w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="size-18 shrink-0" />)}
        </div>
      </div>
    </div>
  );
}

export function ProfileFilesLoading() {
  return (
    <div role="status" aria-label="Loading asset files" className="motion-reduce:[&_*]:animate-none">
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-2 gap-2 @min-xs/profile-section:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="aspect-square w-full" />)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <Skeleton className="size-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Frame 04 opening state (profile opened from Assignments): compact summary, tinted card and table, no rail. */
function AssignmentsTabLoading() {
  return (
    <div role="status" aria-label="Loading asset profile" className="@container/asset-profile min-w-0 space-y-3 motion-reduce:[&_*]:animate-none">
      <span className="sr-only">Loading asset profile…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="my-2 h-4 w-48" />
        <div className="@container/profile-hero">
          <div className="grid items-start gap-3 @min-2xl/profile-hero:grid-cols-[9rem_minmax(0,1fr)]">
            <Skeleton className="h-36 w-40 @min-2xl/profile-hero:w-full" />
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-64 space-y-2">
                  <Skeleton className="h-7 w-56 max-w-full" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
                <Skeleton className="h-8 w-52" />
              </div>
              <Card className="@container/profile-section min-w-0 p-4 motion-reduce:transition-none">
                <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-3 @min-xl/profile-section:grid-cols-3 @min-3xl/profile-section:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="space-y-1">
                      <Skeleton className="h-4 w-20 max-w-full" />
                      <Skeleton className="h-5 w-24 max-w-full" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border py-2">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-6 w-20" />)}
        </div>
        <Card className="@container/current-assignment min-w-0 space-y-3 bg-accent/50! p-4 motion-reduce:transition-none">
          <Skeleton className="h-5 w-36" />
          <div className="grid min-w-0 items-start gap-x-8 gap-y-4 @lg/current-assignment:grid-cols-2 @4xl/current-assignment:grid-cols-[minmax(0,15rem)_minmax(0,8rem)_minmax(0,1fr)_auto]">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <div className="flex gap-2 @4xl/current-assignment:self-center">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </Card>
        <Card className="min-w-0 p-0 motion-reduce:transition-none">
          <div className="px-4 py-3">
            <Skeleton className="h-5 w-36" />
          </div>
          <ProfileAssignmentEventsLoading history={false} />
        </Card>
      </div>
    </div>
  );
}

export function AssetProfileLoading({ tab = "overview" }: { tab?: string }) {
  if (tab === "assignments") return <AssignmentsTabLoading />;
  return (
    <div role="status" aria-label="Loading asset profile" className="@container/asset-profile min-w-0 space-y-3 motion-reduce:[&_*]:animate-none">
      <span className="sr-only">Loading asset profile…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="my-2 h-4 w-48" />
        <div className="grid min-w-0 items-start gap-3 @min-6xl/asset-profile:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 space-y-3">
            <div className="@container/profile-hero">
              <div className="grid items-start gap-3 @min-2xl/profile-hero:grid-cols-[9rem_minmax(0,1fr)] @min-3xl/profile-hero:grid-cols-[12rem_minmax(0,1fr)]">
                <Skeleton className="h-48 w-44 @min-2xl/profile-hero:h-56 @min-2xl/profile-hero:w-full" />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 basis-64 space-y-2">
                      <Skeleton className="h-7 w-56 max-w-full" />
                      <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-8 w-52" />
                  </div>
                  <SummaryLoading />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-border py-2">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-6 w-20" />)}
            </div>
            <div className="grid items-start gap-3 @min-4xl/asset-profile:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <LoadingCard rows={7} />
              <Card className="space-y-3 p-4 motion-reduce:transition-none">
                <Skeleton className="h-5 w-28" />
                <ProfilePhotoLoading />
              </Card>
            </div>
            <Card className="@container/profile-section min-w-0 space-y-3 p-4 motion-reduce:transition-none">
              <Skeleton className="h-5 w-32" />
              <div className="grid min-w-0 items-start gap-3 @min-xl/profile-section:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="grid gap-1 py-2 @min-xs/profile-section:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] @min-xs/profile-section:gap-3">
                      <Skeleton className="h-4 w-20 max-w-full" />
                      <Skeleton className="h-4 w-32 max-w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <div className="grid gap-3 @min-xl/asset-profile:grid-cols-2 @min-6xl/asset-profile:grid-cols-1">
            <LoadingCard rows={2} />
            <LoadingCard rows={4} />
            <LoadingCard rows={2} />
            <LoadingCard rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
