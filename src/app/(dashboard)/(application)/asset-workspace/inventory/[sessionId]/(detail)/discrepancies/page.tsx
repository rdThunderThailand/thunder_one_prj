import { SessionDiscrepanciesView } from "@/features/asset-workspace/components/inventory/SessionDiscrepanciesView";
import { getInventoryFindings, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Session Discrepancies tab: `?q=&type=&category_id=&location_id=&page=&pageSize=` go to Core as they are. The list's
// Issues link lands here.
export default async function SessionDiscrepanciesPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [data, options] = await Promise.all([getInventoryFindings(sessionId, sp), getScopeOptions()]);
  return (
    <SessionDiscrepanciesView
      data={data}
      options={{ categories: options?.categories ?? [], locations: options?.locations ?? [] }}
    />
  );
}
