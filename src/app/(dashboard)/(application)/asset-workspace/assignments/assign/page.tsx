import { getSession } from "@/features/auth/services/get-session";
import { AssignFlowView } from "@/features/asset-workspace/components/assignments/AssignFlowView";
import { AccessDeniedState } from "@/features/asset-workspace/components/states/states";

export default async function AssignAssetPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  return (
    <AssignFlowView
      key={context}
      context={context}
      assetId={null}
      from="assignments"
    />
  );
}
