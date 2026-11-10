import { Suspense } from "react";
import { AssignmentsLoading } from "@/features/asset-workspace/components/assignments/AssignmentsLoading";
import { AssignmentsRouteLoading } from "@/features/asset-workspace/components/assignments/AssignmentsRouteLoading";

export default function Loading() {
  return (
    <Suspense fallback={<AssignmentsLoading />}>
      <AssignmentsRouteLoading />
    </Suspense>
  );
}
