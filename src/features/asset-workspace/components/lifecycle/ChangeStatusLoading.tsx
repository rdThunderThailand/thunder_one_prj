import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRightIcon } from "@/components/ui/icons";
import { CHANGE_STATUS_STEPS, CHANGE_STATUS_SUBTITLE, CHANGE_STATUS_TITLE } from "../../domain/asset-lifecycle-actions";
import { ActionLayout, AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";

export const changeStatusBodyClass =
  "relative min-w-0 p-1 group-data-[bounded=true]/assign-flow:min-h-0 group-data-[bounded=true]/assign-flow:flex-1 group-data-[bounded=true]/assign-flow:overflow-y-auto group-data-[bounded=true]/assign-flow:[scrollbar-gutter:stable]";

// Reserve the same scrollbar space as the bounded body so the footer follows the form edges.
export const changeStatusFooterFrame =
  "min-w-0 px-1 group-data-[bounded=true]/assign-flow:overflow-hidden group-data-[bounded=true]/assign-flow:[scrollbar-gutter:stable]";
export const changeStatusFooterColumns =
  "grid @min-4xl/assign-flow:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] @min-4xl/assign-flow:gap-3";
export const changeStatusFooterSurface =
  "flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-card p-3";

export function ChangeStatusFieldsLoading() {
  return (
    <Card aria-hidden="true" className="space-y-4 p-4 motion-reduce:[&_*]:animate-none">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3 w-56 max-w-full" />
      {[0, 1].map((row) => (
        <div key={row} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
            {row === 0 && <Skeleton className="h-16 w-full" />}
          </div>
        </div>
      ))}
      {[16, 24, 28].map((height, index) => (
        <div key={height} className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={index === 0 ? "h-16 w-full" : index === 1 ? "h-24 w-full" : "h-28 w-full"} />
        </div>
      ))}
    </Card>
  );
}

export function ChangeStatusRailLoading() {
  return (
    <div aria-hidden="true" className="space-y-3 motion-reduce:[&_*]:animate-none">
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-16 shrink-0" />
          <Skeleton className="h-10 flex-1" />
        </div>
        {Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-4 w-full" />)}
        <Skeleton className="h-16 w-full" />
      </Card>
      <Skeleton className="h-24 w-full rounded-control" />
      <Skeleton className="h-24 w-full rounded-control" />
    </div>
  );
}

export function ChangeStatusFooterLoading() {
  return (
    <div aria-hidden="true" className={`${changeStatusFooterFrame} ${changeStatusFooterColumns} motion-reduce:[&_*]:animate-none`}>
      <div className={changeStatusFooterSurface}>
        <Skeleton className="h-8 w-20 max-sm:h-10" />
        <Skeleton className="h-8 w-28 max-sm:h-10" />
      </div>
    </div>
  );
}

/** Route loading for every lifecycle page; Retire passes its own title and subtitle. */
/** `steps={null}` for pages without a stepper (FE 06 Label). */
export function ChangeStatusLoading({ from, title = CHANGE_STATUS_TITLE, subtitle = CHANGE_STATUS_SUBTITLE, steps = CHANGE_STATUS_STEPS }: {
  from?: "assignments"; title?: string; subtitle?: string; steps?: string[] | null;
}) {
  const origin = from === "assignments"
    ? { href: "/asset-workspace/assignments", label: "Assignments" }
    : { href: "/asset-workspace/assets", label: "Assets" };
  return (
    <AssignFlowWorkspace>
      <div aria-hidden="true" className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{origin.label}</span>
        <ChevronRightIcon className="size-3" />
        <Skeleton className="h-3 w-24" />
        <ChevronRightIcon className="size-3" />
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      <div data-assign-body className={changeStatusBodyClass}>
        <p role="status" className="sr-only">Loading asset…</p>
        <ActionLayout
          head={(
            <div className="rounded-card border border-border bg-card p-4">
              <AssignFlowTitle
                origin={origin}
                title={title}
                subtitle={subtitle}
                steps={steps ?? undefined}
              />
            </div>
          )}
          main={<ChangeStatusFieldsLoading />}
          panel={<ChangeStatusRailLoading />}
        />
      </div>
      <ChangeStatusFooterLoading />
    </AssignFlowWorkspace>
  );
}
