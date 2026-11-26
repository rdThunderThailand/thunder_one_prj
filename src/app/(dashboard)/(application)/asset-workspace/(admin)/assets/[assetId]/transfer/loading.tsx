import { TRANSFER_STEPS } from "@/features/asset-workspace/domain/assignment-transfer";
import { AssignFlowLoading } from "@/features/asset-workspace/components/assignments/AssignFlowLoading";

export default function Loading() {
  return (
    <AssignFlowLoading
      title="Transfer Asset"
      subtitle="Transfer this asset to a new custodian."
      steps={TRANSFER_STEPS}
      kind="transfer"
    />
  );
}
