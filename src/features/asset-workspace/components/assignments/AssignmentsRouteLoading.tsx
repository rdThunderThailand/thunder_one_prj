"use client";

import { useSearchParams } from "next/navigation";
import { AssignmentsLoading } from "./AssignmentsLoading";

export function AssignmentsRouteLoading() {
  const params = useSearchParams();
  return (
    <AssignmentsLoading history={params.get("tab") === "history"} />
  );
}
