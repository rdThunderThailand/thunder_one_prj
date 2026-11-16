import { ActionRoute } from "@/features/asset-workspace/components/assignments/ActionRoute";

export default function Page({ params }: { params: Promise<{ assetId: string }> }) {
  return (
    <ActionRoute
      params={params}
      action="transfer"
      from="assignments"
    />
  );
}
