import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { EditAssetView } from "@/features/asset-workspace/components/asset-edit/EditAssetView";
import { AccessDeniedState, NotFoundState } from "@/features/asset-workspace/components/states/states";
import { startEditFirstData } from "@/features/asset-workspace/services/asset-edit-first-data";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditAssetPage({ params }: { params: Promise<{ assetId: string }> }) {
  const [{ assetId }, session, token] = await Promise.all([params, getSession(), getAuthToken()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (!GUID.test(assetId)) return <NotFoundState title="Asset not found" />;
  const context = `${session.tenantId}:${session.userId}`;
  const id = assetId.toLowerCase();
  const firstData = token ? await startEditFirstData(token, session.tenantId, context, id) : undefined;
  return <EditAssetView key={`${context}:${assetId}`} context={context} assetId={id} firstData={firstData} />;
}
