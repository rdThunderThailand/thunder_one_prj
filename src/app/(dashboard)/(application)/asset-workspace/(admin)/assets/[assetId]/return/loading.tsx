import { RETURN_STEPS } from "@/features/asset-workspace/domain/assignment-return";
import { AssignFlowLoading } from "@/features/asset-workspace/components/assignments/AssignFlowLoading";

export default function Loading() {
  return (
    <AssignFlowLoading title="Return Asset" subtitle="Return this asset from its current custodian." steps={RETURN_STEPS} kind="return" />
  );
}
