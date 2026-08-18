import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssetOverviewDashboard, AssetsListPage } from "@/features/ai-assets";

// Asset/IT Manager — "Asset Overview" (requirement doc §4.2).
export default function AssetIntelligenceAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asset Overview"
        subtitle="Manage asset risk and operations."
        actions={
          <Button variant="primary">
            <PlusIcon className="h-4 w-4" /> Add Asset
          </Button>
        }
      />
      <AssetOverviewDashboard />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">All Assets</h2>
        <AssetsListPage />
      </div>
    </div>
  );
}
