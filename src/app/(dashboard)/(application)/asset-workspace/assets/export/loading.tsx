import { EXPORT_SUBTITLE, EXPORT_TITLE } from "@/features/asset-workspace/domain/asset-lifecycle-actions";
import { ChangeStatusLoading } from "@/features/asset-workspace/components/lifecycle/ChangeStatusLoading";

export default function Loading() {
  return <ChangeStatusLoading title={EXPORT_TITLE} subtitle={EXPORT_SUBTITLE} steps={null} />;
}
