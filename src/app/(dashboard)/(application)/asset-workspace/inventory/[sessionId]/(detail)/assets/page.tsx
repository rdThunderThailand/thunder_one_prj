import { SessionAssetsView } from "@/features/asset-workspace/components/inventory/SessionAssetsView";
import { getInventorySessionAssets } from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Session Assets tab: `?q=&result=&category_id=&page=&pageSize=` go to Core as they are.
export default async function SessionAssetsPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  return <SessionAssetsView data={await getInventorySessionAssets(sessionId, sp)} />;
}
