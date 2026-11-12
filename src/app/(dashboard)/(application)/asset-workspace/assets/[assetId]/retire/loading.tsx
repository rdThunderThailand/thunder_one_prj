import { RETIRE_SUBTITLE, RETIRE_TITLE } from "@/features/asset-workspace/domain/asset-lifecycle-actions";
import { ChangeStatusLoading } from "@/features/asset-workspace/components/lifecycle/ChangeStatusLoading";

export default function Loading() {
  return <ChangeStatusLoading title={RETIRE_TITLE} subtitle={RETIRE_SUBTITLE} />;
}
