import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { assignOrigin } from "../../domain/assignment-assign";
import { ActionLayout, AssignFlowCrumb, AssignFlowTitle } from "./AssignFlowHeader";
import { AssignFlowWorkspace } from "./AssignFlowWorkspace";

const field = (
  <div className="space-y-1">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
  </div>
);
const reason = (
  <div className="space-y-1">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="ml-auto h-3 w-10" />
  </div>
);
const attachments = (
  <div className="space-y-2">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-28 w-full rounded-control" />
  </div>
);

/** Left column placeholder, one card per real section (Assign: 2, Transfer: 3), so nothing jumps on load. */
export function AssignLoadingMain({ label = "Loading asset…", kind = "assign" }: { label?: string; kind?: "assign" | "transfer" }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="min-w-0 space-y-3 motion-reduce:[&_*]:animate-none"
    >
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-control" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="hidden w-60 space-y-2 @min-2xl/assign-flow:block">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full" />
        <div className="pt-1">{field}</div>
      </Card>
      {kind === "transfer" ? (
        <>
          <Card className="space-y-3 p-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid gap-3 @min-2xl/assign-flow:grid-cols-2">
              {field}
              <div className="space-y-1">
                {field}
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            {reason}
          </Card>
          <Card className="space-y-3 p-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="max-w-xs">{field}</div>
            {attachments}
          </Card>
        </>
      ) : (
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          {reason}
          {attachments}
        </Card>
      )}
    </div>
  );
}

/** Right column placeholder: the panel's three cards (summary, what will happen, recent history), level with the title. */
export function AssignLoadingPanel() {
  return (
    <div
      aria-hidden="true"
      className="min-w-0 space-y-3 motion-reduce:[&_*]:animate-none"
    >
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-control" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-36 w-full rounded-control" />
        <Skeleton className="h-22 w-full rounded-control" />
      </Card>
      <Card className="space-y-2 p-4">
        <Skeleton className="h-5 w-32" />
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="flex items-center gap-2"
          >
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </Card>
      <Card className="space-y-2 p-4">
        <Skeleton className="h-5 w-44" />
        <div className="flex min-h-12 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3 flex-1" />
        </div>
      </Card>
    </div>
  );
}

/** Route loading has no params, so the header falls back to the Assignments origin. */
export function AssignFlowLoading({ title = "Assign Asset", subtitle = "Assign this asset to a person or team.", steps, kind, mockNote = false }: {
  title?: string; subtitle?: string; steps?: string[]; kind?: "assign" | "transfer"; mockNote?: boolean;
}) {
  const origin = assignOrigin(undefined, null);
  return (
    <AssignFlowWorkspace>
      <AssignFlowCrumb
        origin={origin}
        assetId={null}
        title={title}
      />
      <div data-assign-body>
        <ActionLayout
          head={(
            <AssignFlowTitle
              origin={origin}
              title={title}
              subtitle={subtitle}
              steps={steps}
              mockNote={mockNote}
            />
          )}
          main={<AssignLoadingMain kind={kind} />}
          panel={<AssignLoadingPanel />}
        />
      </div>
    </AssignFlowWorkspace>
  );
}
