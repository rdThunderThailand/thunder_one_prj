import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssetProfileView } from "@/features/asset-workspace/components/asset-profile/AssetProfileView";
import { AccessDeniedState, NotFoundState } from "@/features/asset-workspace/components/states/states";
import { startProfileFirstData } from "@/features/asset-workspace/services/asset-profile-first-data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AssetProfilePage({ params }: { params: Promise<{ assetId: string }> }) {
  const [{ assetId }, session, token] = await Promise.all([params, getSession(), getAuthToken()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (!UUID.test(assetId)) return <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />;
  const context = `${session.tenantId}:${session.userId}`;
  const id = assetId.toLowerCase();
  const firstData = token ? await startProfileFirstData(token, session.tenantId, context, id) : undefined;
  return <AssetProfileView key={`${context}:${assetId}`} context={context} assetId={id} firstData={firstData} />;
}
