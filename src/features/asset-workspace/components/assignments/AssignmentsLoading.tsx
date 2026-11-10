import { Skeleton } from "@/components/ui/Skeleton";
import { AssignmentsWorkspace } from "./AssignmentsWorkspace";
import { AssignmentsResults } from "./AssignmentsResults";
import { AssignmentsTableLoading } from "./AssignmentsTableLoading";

export function AssignmentsLoading() {
  return (
    <AssignmentsWorkspace>
      <div aria-hidden="true" className="flex flex-wrap items-start justify-between gap-3 motion-reduce:[&_*]:animate-none">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div aria-hidden="true" className="flex gap-1 border-b border-border motion-reduce:[&_*]:animate-none">
        <Skeleton className="h-10 w-40 rounded-none" />
        <Skeleton className="h-10 w-40 rounded-none" />
      </div>
      <div aria-hidden="true" className="grid grid-cols-1 gap-2 motion-reduce:[&_*]:animate-none @xl/assignments:grid-cols-3 @4xl/assignments:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <Skeleton className="h-10 w-full @xl/assignments:col-span-3 @4xl/assignments:col-span-1" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
      <AssignmentsResults busy footer={(
        <div aria-hidden="true" className="mt-4 flex flex-wrap items-center justify-between gap-3 motion-reduce:[&_*]:animate-none">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-8 w-60 max-w-full" />
        </div>
      )}>
        <AssignmentsTableLoading />
      </AssignmentsResults>
    </AssignmentsWorkspace>
  );
}
