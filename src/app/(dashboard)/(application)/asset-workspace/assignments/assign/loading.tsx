import { assignSteps } from "@/features/asset-workspace/domain/assignment-assign";
import { AssignFlowLoading } from "@/features/asset-workspace/components/assignments/AssignFlowLoading";

export default function Loading() {
  return (
    <AssignFlowLoading
      steps={assignSteps(true)}
      mockNote
    />
  );
}
