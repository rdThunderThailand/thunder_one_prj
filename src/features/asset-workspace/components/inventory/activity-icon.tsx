// One icon + tone per activity row, shared by the Overview timeline and the Activity table.
import type { ReactNode } from "react";
import { AlertCircleIcon, CheckIcon, ClockIcon, PlayIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import { activityResult, type ActivityRow } from "../../domain/inventory";
import { FINDING_STATE_TONE, INVENTORY_RESULT_TONE, SESSION_STATUS_TONE, type StatusTone } from "../../domain/status-tone";

/** Filled circle per entry. The colour is never chosen here: a result takes its tone from INVENTORY_RESULT_TONE, a
 *  lifecycle event from SESSION_STATUS_TONE, a decision from FINDING_STATE_TONE (status-tone.ts, ADR 0098 §3). */
export function activityIcon(r: ActivityRow): { icon: ReactNode; tone: StatusTone } {
  const result = activityResult(r);
  if (result) {
    const icon = result === "Verified" ? <CheckIcon /> : result === "Mismatch" ? <WarningTriangleIcon /> : <XCircleIcon />;
    return { icon, tone: INVENTORY_RESULT_TONE[result] };
  }
  switch (r.action) {
    case "report_unexpected":
      return { icon: <WarningTriangleIcon />, tone: INVENTORY_RESULT_TONE.Unexpected };
    case "reconcile":
      return { icon: <CheckIcon />, tone: FINDING_STATE_TONE[r.details?.decision === "dismiss" ? "dismissed" : "reconciled"] };
    case "start":
      return { icon: <PlayIcon />, tone: SESSION_STATUS_TONE["In Progress"] };
    case "complete":
      return { icon: <CheckIcon />, tone: SESSION_STATUS_TONE.Completed };
    case "close":
      return { icon: <CheckIcon />, tone: SESSION_STATUS_TONE.Closed };
    case "cancel":
      return { icon: <AlertCircleIcon />, tone: SESSION_STATUS_TONE.Cancelled };
    default:
      return { icon: <ClockIcon />, tone: "zinc" };
  }
}
