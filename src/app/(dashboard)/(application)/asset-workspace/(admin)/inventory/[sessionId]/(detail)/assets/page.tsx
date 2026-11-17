import { SessionAssetsView } from "@/features/asset-workspace/components/inventory/SessionAssetsView";
import { sessionActions } from "@/features/asset-workspace/domain/inventory";
import { getInventorySession, getInventorySessionAssets, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Session Assets tab: `?q=&result=&category_id=&page=&pageSize=` go to Core as they are. The session comes from the
// layout's cached request; the location / custodian choices feed the Verify and Report Unexpected dialogs.
export default async function SessionAssetsPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [session, data, options] = await Promise.all([
    getInventorySession(sessionId),
    getInventorySessionAssets(sessionId, sp),
    getScopeOptions(),
  ]);
  const canVerify = typeof session === "object" && session !== null && sessionActions(session.status).continue;
  return (
    <SessionAssetsView
      sessionId={sessionId}
      counts={typeof session === "object" && session !== null ? session.counts : null}
      data={data}
      canVerify={canVerify}
      options={{ locations: options?.locations ?? [], custodians: options?.custodyTargets ?? [] }}
    />
  );
}
