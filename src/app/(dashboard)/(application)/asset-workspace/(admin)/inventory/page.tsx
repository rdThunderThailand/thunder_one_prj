import { InventorySessionsView } from "@/features/asset-workspace/components/inventory/InventorySessionsView";
import { getInventorySessions, getInventorySummary } from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Inventory › Sessions (UC-007 · PO 05 §4.9). Filters live in the URL; KPIs ignore them, like Figma `486:993`.
export default async function InventorySessionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [summary, sessions] = await Promise.all([getInventorySummary(), getInventorySessions(sp)]);
  return (
    <InventorySessionsView
      summary={summary}
      data={sessions.data}
    />
  );
}
