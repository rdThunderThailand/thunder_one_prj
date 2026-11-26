import { LABEL_SUBTITLE, LABEL_TITLE } from "@/features/asset-workspace/domain/asset-lifecycle-actions";
import { ChangeStatusLoading } from "@/features/asset-workspace/components/lifecycle/ChangeStatusLoading";

export default function Loading() {
  return <ChangeStatusLoading from="assignments" title={LABEL_TITLE} subtitle={LABEL_SUBTITLE} steps={null} />;
}
