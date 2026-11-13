import { SessionDiscrepanciesView } from "@/features/asset-workspace/components/inventory/SessionDiscrepanciesView";
import { sessionActions } from "@/features/asset-workspace/domain/inventory";
import { getInventoryFindings, getInventorySession, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Session Discrepancies tab: `?q=&type=&category_id=&location_id=&state=&page=&pageSize=` go to Core as they are. The
// list's Issues link and Review & Reconcile land here.
export default async function SessionDiscrepanciesPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [session, data, options] = await Promise.all([
    getInventorySession(sessionId),
    getInventoryFindings(sessionId, sp),
    getScopeOptions(),
  ]);
  const canReconcile = typeof session === "object" && session !== null && sessionActions(session.status).close;
  return (
    <SessionDiscrepanciesView
      sessionId={sessionId}
      data={data}
      canReconcile={canReconcile}
      options={{ categories: options?.categories ?? [], locations: options?.locations ?? [] }}
    />
  );
}
