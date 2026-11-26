import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AssetEditHeader } from "./AssetEditHeader";
import { AssetEditWorkspace } from "./AssetEditWorkspace";

function FieldLoading({ calendar = false }: { calendar?: boolean }) {
  return (
    <div className="space-y-1">
      <Skeleton className="h-4 w-28" />
      <Skeleton className={calendar ? "h-9 w-full rounded-control max-sm:h-10" : "h-10 w-full rounded-control"} />
    </div>
  );
}

export function AssetEditFormLoading() {
  return (
    <div data-asset-edit-body role="status" aria-label="Loading asset edit form" className="flex min-w-0 flex-col gap-3 motion-reduce:[&_*]:animate-none group-data-[bounded=true]/asset-edit-workspace:min-h-0 group-data-[bounded=true]/asset-edit-workspace:flex-1 group-data-[bounded=true]/asset-edit-workspace:shrink">
      <div aria-hidden="true" className="min-w-0 p-1 group-data-[bounded=true]/asset-edit-workspace:min-h-0 group-data-[bounded=true]/asset-edit-workspace:flex-1 group-data-[bounded=true]/asset-edit-workspace:overflow-y-auto">
        <div className="grid min-w-0 items-start gap-3 @min-4xl/asset-edit-workspace:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <Card className="@container/asset-edit-fields space-y-4 p-4 motion-reduce:transition-none">
            <Skeleton className="h-5 w-36" />
            <FieldLoading />
            <FieldLoading />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid min-w-0 gap-4 @min-lg/asset-edit-fields:grid-cols-2">
              <FieldLoading />
              <FieldLoading calendar />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full rounded-control" />
            </div>
          </Card>
          <Card className="@container/profile-section space-y-3 p-4 motion-reduce:transition-none">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-full" />
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid gap-1 py-2 @min-xs/profile-section:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] @min-xs/profile-section:gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className={index === 5 ? "h-8 w-full" : "h-4 w-full"} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div data-asset-edit-footer aria-hidden="true" className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3">
        <Skeleton className="h-8 w-20 max-sm:h-10" />
        <Skeleton className="h-8 w-28 max-sm:h-10" />
      </div>
    </div>
  );
}

export function AssetEditLoading() {
  return (
    <AssetEditWorkspace>
      <AssetEditHeader />
      <AssetEditFormLoading />
    </AssetEditWorkspace>
  );
}
