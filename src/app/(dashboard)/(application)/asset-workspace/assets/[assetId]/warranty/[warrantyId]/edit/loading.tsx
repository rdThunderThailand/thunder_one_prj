import { EDIT_WARRANTY_TITLE, WARRANTY_SUBTITLE } from "@/features/asset-workspace/domain/warranty-form";
import { ChangeStatusLoading } from "@/features/asset-workspace/components/lifecycle/ChangeStatusLoading";

export default function Loading() {
  return <ChangeStatusLoading title={EDIT_WARRANTY_TITLE} subtitle={WARRANTY_SUBTITLE} steps={null} />;
}
