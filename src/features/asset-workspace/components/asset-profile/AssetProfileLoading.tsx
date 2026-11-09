import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

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
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
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
        <Skeleton className="h-4 w-24" />
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <Skeleton className="size-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileHistoryLoading() {
  return (
    <div role="status" aria-label="Loading asset history" className="motion-reduce:[&_*]:animate-none">
      <div aria-hidden="true" className="divide-y divide-border">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssetProfileLoading() {
  return (
    <div role="status" aria-label="Loading asset profile" className="@container/asset-profile min-w-0 space-y-3 motion-reduce:[&_*]:animate-none">
      <span className="sr-only">Loading asset profile…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="my-2 h-4 w-48" />
        <div className="grid min-w-0 items-start gap-3 @min-6xl/asset-profile:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 space-y-3">
            <div className="@container/profile-hero">
              <div className="grid items-start gap-3 @min-2xl/profile-hero:grid-cols-[9rem_minmax(0,1fr)]">
                <Skeleton className="h-40 w-36 @min-2xl/profile-hero:h-56 @min-2xl/profile-hero:w-full" />
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
            <LoadingCard rows={2} />
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
