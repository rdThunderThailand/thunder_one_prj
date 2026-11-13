import { InventoryWizard } from "@/features/asset-workspace/components/inventory/InventoryWizard";
import { bangkokToday } from "@/features/asset-workspace/domain/inventory";
import { getInventoryOwners, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";

// Start Inventory step 1 (UC-007). Next creates the Draft and moves to `{id}/setup?step=2`; `?location=` (a Location's
// Start Inventory) rides along and fills step 2's Locations.
export default async function NewInventoryPage({ searchParams }: { searchParams: Promise<{ location?: string | string[] }> }) {
  const [sp, owners, options] = await Promise.all([searchParams, getInventoryOwners(), getScopeOptions()]);
  return (
    <InventoryWizard
      session={null}
      step={1}
      owners={owners}
      options={options}
      today={bangkokToday()}
      prefillLocation={typeof sp.location === "string" ? sp.location : undefined}
    />
  );
}
