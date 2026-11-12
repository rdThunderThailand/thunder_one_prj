import { InventoryWizard } from "@/features/asset-workspace/components/inventory/InventoryWizard";
import { bangkokToday } from "@/features/asset-workspace/domain/inventory";
import { getInventoryOwners, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";

// Start Inventory step 1 (UC-007). Next creates the Draft and moves to `{id}/setup?step=2`.
export default async function NewInventoryPage() {
  const [owners, options] = await Promise.all([getInventoryOwners(), getScopeOptions()]);
  return (
    <InventoryWizard
      session={null}
      step={1}
      owners={owners}
      options={options}
      today={bangkokToday()}
    />
  );
}
