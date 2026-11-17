import { getSession } from "@/features/auth/services/get-session";
import { EditAssetView } from "@/features/asset-workspace/components/asset-edit/EditAssetView";
import { AccessDeniedState, NotFoundState } from "@/features/asset-workspace/components/states/states";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditAssetPage({ params }: { params: Promise<{ assetId: string }> }) {
  const [{ assetId }, session] = await Promise.all([params, getSession()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (!GUID.test(assetId)) return <NotFoundState title="Asset not found" />;
  const context = `${session.tenantId}:${session.userId}`;
  return <EditAssetView key={`${context}:${assetId}`} context={context} assetId={assetId.toLowerCase()} />;
}
