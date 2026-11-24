import { AssetActivityHistoryCard } from "./AssetActivityHistoryCard";
import { AssetAdditionalInfoCard } from "./AssetAdditionalInfoCard";
import { AssetDetailHeader } from "./AssetDetailHeader";
import { AssetIdentityCard } from "./AssetIdentityCard";
import { AssetLatestCountCard } from "./AssetLatestCountCard";
import { AssetLifecycleCard } from "./AssetLifecycleCard";
import { AssetRelatedDocumentsCard } from "./AssetRelatedDocumentsCard";
import { AssetStatusAllocationCard } from "./AssetStatusAllocationCard";
import { AssetWarrantyCard } from "./AssetWarrantyCard";
import type { AssetActivityEntry, AssetAttachment, AssetDetail } from "../services/asset-list-api";

// The single-asset drill-down page reached by clicking a row in
// AssetRegistryTable, backed by `GET .../assets/{assetId}` plus its two
// sibling endpoints (assets/all/[assetId]/page.tsx fetches all three).
// Identity/Status & Allocation/Additional Info/Lifecycle/Related
// Documents/Activity History now all show real data (P1/P3/P6/P7, Core
// 2026-08-26 — docs/asset-intelligence/asset-detail-page-api-gap-analysis.md).
// Warranty & Latest Count are still genuinely unbuilt on Core's side (P4/P5)
// and keep the explicit "not available" state (DetailSectionUnavailable)
// rather than fake content (Nie, 2026-08-26: wire real fields, placeholder
// the rest).
export function AssetDetailPage({
  asset,
  activity,
  attachments,
}: {
  asset: AssetDetail;
  activity: AssetActivityEntry[] | null;
  attachments: AssetAttachment[] | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AssetDetailHeader asset={asset} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AssetIdentityCard asset={asset} />
        <AssetStatusAllocationCard asset={asset} />
        <AssetLifecycleCard asset={asset} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AssetWarrantyCard />
            <AssetRelatedDocumentsCard assetId={asset.id} attachments={attachments} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <AssetLatestCountCard />
          <AssetAdditionalInfoCard asset={asset} />
        </div>
      </div>

      <AssetActivityHistoryCard activity={activity} />
    </div>
  );
}
