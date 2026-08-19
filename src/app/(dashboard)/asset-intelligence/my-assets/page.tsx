import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyAssetsPage as MyAssetsList } from "@/features/ai-assets";

// Employee/User — "My Assets" (requirement doc §4.5).
export default function MyAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Assets"
        subtitle="Equipment currently assigned to you."
        actions={
          <Button variant="secondary">
            <SearchIcon className="h-4 w-4" /> Scan QR
          </Button>
        }
      />
      <MyAssetsList />
    </div>
  );
}
