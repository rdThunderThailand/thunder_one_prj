import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { getSession, type SessionResult } from "@/features/auth/services/get-session";
import { assetQrProfilePath, readAssetQrPath } from "@/features/asset-workspace/domain/asset-qr-reference";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";

/** Camera entry only. Asset details are still authorized by the existing Profile route/API. */
export default async function AssetQrPage({ params }: { params: Promise<{ tenantId: string; assetId: string }> }) {
  const { tenantId, assetId } = await params;
  const path = `/${tenantId}/assets/${assetId}`;
  let session: SessionResult | null = null;
  let needsLogin = false;
  if (readAssetQrPath(path)) {
    try { session = await getSession(); }
    catch (error) {
      // Preserve this QR address on expired-cookie recovery without changing other login flows.
      if (isRedirectError(error) && getURLFromRedirectError(error) === "/login") needsLogin = true;
      else throw error;
    }
  }
  if (needsLogin) redirect(`/login?next=${encodeURIComponent(path)}`);
  const target = session && session !== "forbidden" && session.tenantId && session.userId
    ? assetQrProfilePath(tenantId, assetId, session.tenantId) : null;
  if (target) redirect(target);
  return (
    <main className="p-6">
      <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
    </main>
  );
}
