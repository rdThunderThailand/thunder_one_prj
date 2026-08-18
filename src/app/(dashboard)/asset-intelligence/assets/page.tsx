import { PageHeader } from "@/components/layout/PageHeader";
import { AssetsListPage } from "@/features/ai-assets";

// Asset/IT Manager — "Asset Overview" (requirement doc §4.2).
export default function AssetIntelligenceAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Asset Overview" subtitle="Manage asset risk and operations." />
      <AssetsListPage />
    </div>
  );
}
