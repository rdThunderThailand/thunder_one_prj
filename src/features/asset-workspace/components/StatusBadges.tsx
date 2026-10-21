import { Badge } from "@/components/ui/Badge";
import type { AssetCondition } from "../domain/asset-condition";
import type { AssetStatus } from "../domain/asset-status";
import { CONDITION_TONE, STATUS_TONE } from "../domain/status-tone";

export function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge
      color={STATUS_TONE[status]}
      variant="pill"
    >
      {status}
    </Badge>
  );
}

/** Core has no condition yet (CORE-GAP:condition), so `null` renders a dash. */
export function ConditionBadge({ condition }: { condition: AssetCondition | null }) {
  if (!condition) return <span className="text-t1-gray-400">—</span>;
  return (
    <Badge
      color={CONDITION_TONE[condition]}
      variant="pill"
    >
      {condition}
    </Badge>
  );
}
