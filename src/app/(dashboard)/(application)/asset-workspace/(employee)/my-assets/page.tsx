import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/features/asset-workspace/components/states/states";

// Placeholder until the My Assets batch (EMP-02) replaces it.
export default function MyAssetsPage() {
  return (
    <div className="space-y-4 p-6">
      <PageHeader title="My Assets" />
      <EmptyState
        title="No assets yet"
        body="Your assigned assets will appear here."
      />
    </div>
  );
}
