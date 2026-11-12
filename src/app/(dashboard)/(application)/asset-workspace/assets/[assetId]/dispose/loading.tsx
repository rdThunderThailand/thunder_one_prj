import { DISPOSE_SUBTITLE, DISPOSE_TITLE } from "@/features/asset-workspace/domain/asset-lifecycle-actions";
import { ChangeStatusLoading } from "@/features/asset-workspace/components/lifecycle/ChangeStatusLoading";

export default function Loading() {
  return <ChangeStatusLoading title={DISPOSE_TITLE} subtitle={DISPOSE_SUBTITLE} />;
}
