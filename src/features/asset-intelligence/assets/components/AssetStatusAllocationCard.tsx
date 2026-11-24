import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ASSET_STATUS_BADGE_COLOR, ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetListRow } from "../services/asset-list-api";

function formatLocation(asset: AssetListRow): string {
  const parts = [asset.building, asset.floor, asset.room].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" / ") : "—";
}

// Allocation-specific concepts (allocated date, allocated by, purpose,
// note) have no column in Core's schema at all — not just null for this
// asset, genuinely absent — so this card only shows what a List row
// actually carries: status, location, and current holder.
export function AssetStatusAllocationCard({ asset }: { asset: AssetListRow }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">สถานะและการจัดสรร</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-t1-gray-400">สถานะทรัพย์สิน</dt>
          <dd>
            <Badge variant="pill" color={ASSET_STATUS_BADGE_COLOR[asset.status]}>
              {ASSET_STATUS_LABEL_TH[asset.status]}
            </Badge>
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-t1-gray-400">สถานที่ปัจจุบัน</dt>
          <dd className="text-foreground">{formatLocation(asset)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-t1-gray-400">ผู้ถือครองปัจจุบัน</dt>
          <dd className="text-foreground">
            {asset.owner ?? "—"}
            {asset.department && <span className="text-xs text-t1-gray-400"> · {asset.department}</span>}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
