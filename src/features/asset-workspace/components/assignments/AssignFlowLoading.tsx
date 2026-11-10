import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { assignOrigin } from "../../domain/assignment-assign";
import { AssignFlowHeader } from "./AssignFlowHeader";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";

/** Same shape as the form and side panel, so nothing jumps when the asset arrives. */
export function AssignFlowBodyLoading({ label = "Loading asset…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid min-w-0 items-start gap-3 motion-reduce:[&_*]:animate-none @min-4xl/assign-flow:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]"
    >
      <div className="space-y-3">
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
        </Card>
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    </div>
  );
}

/** Route loading has no params, so the header falls back to the Assignments origin. */
export function AssignFlowLoading() {
  return (
    <AssignFlowWorkspace>
      <AssignFlowHeader
        origin={assignOrigin(undefined, null)}
        assetId={null}
      />
      <div data-assign-body>
        <AssignFlowBodyLoading />
      </div>
    </AssignFlowWorkspace>
  );
}
