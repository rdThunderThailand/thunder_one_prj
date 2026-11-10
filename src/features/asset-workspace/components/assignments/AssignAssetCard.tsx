import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import type { AssetStatus } from "../../domain/asset-status";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { StatusBadge } from "../StatusBadges";

export function AssignAssetCard({ asset, thumbnailUrl }: { asset: AssetDetail; thumbnailUrl: string | null }) {
  return (
    <Card className="@container/assign-asset space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ClipboardIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        Asset Information
      </h2>
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <AssetThumbnail
          src={thumbnailUrl}
          className="size-16"
          iconClassName="size-7"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground wrap-anywhere">
            {asset.name}
            <StatusBadge status={asset.lifecycleStatus as AssetStatus} />
          </p>
          <p className="text-2xs text-muted-foreground wrap-anywhere">
            {[asset.assetTag, asset.category?.name].filter(Boolean).join(" · ")}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-2xs">
          <dt className="text-muted-foreground">Serial Number</dt>
          <dd className="text-foreground wrap-anywhere">{asset.serialNumber || "—"}</dd>
          <dt className="text-muted-foreground">Current Custodian</dt>
          <dd className="text-foreground">None</dd>
        </dl>
      </div>
    </Card>
  );
}
