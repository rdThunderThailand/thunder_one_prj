import { getSession } from "@/features/auth/services/get-session";
import { AssignFlowView } from "@/features/asset-workspace/components/assignments/AssignFlowView";
import { AccessDeniedState, NotFoundState } from "@/features/asset-workspace/components/states/states";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AssignThisAssetPage({ params, searchParams }: {
  params: Promise<{ assetId: string }>; searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ assetId }, { from }, session] = await Promise.all([params, searchParams, getSession()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (!GUID.test(assetId)) return <NotFoundState title="Asset not found" />;
  const context = `${session.tenantId}:${session.userId}`;
  return (
    <AssignFlowView
      key={`${context}:${assetId}`}
      context={context}
      assetId={assetId.toLowerCase()}
      from={from === "assignments" ? "assignments" : undefined}
    />
  );
}
