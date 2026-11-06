// "Lifecycle & Condition Details" table on the Reports Lifecycle tab (FigJam 530:1035). Same `assets/list` rows as the
// Assets page, own columns. Lifecycle Stage = the 5 lifecycle statuses (03 §2.6; Lead 2026-11-04). Read only.
import { Badge } from "@/components/ui/Badge";
import { BoxIcon } from "@/components/ui/icons";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { assetAge, type WarrantyStatus } from "../../domain/report";
import { WARRANTY_TONE } from "../../domain/status-tone";
import type { AssetListRow } from "../../services/assets-list-types";
import { ConditionBadge, StatusBadge } from "../StatusBadges";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const date = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");
const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

function WarrantyBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="pill"
      color={WARRANTY_TONE[status as WarrantyStatus] ?? "zinc"}
      className="whitespace-nowrap"
    >
      {status}
    </Badge>
  );
}

export function LifecycleTable({ rows }: { rows: AssetListRow[] }) {
  const today = bangkokToday();
  const cell = "border-b border-border px-3 py-2 align-middle";

  return (
    <table className="w-full min-w-[60rem] border-separate border-spacing-0 text-left text-xs">
      <caption className="sr-only">Lifecycle and condition of assets in this organization.</caption>
      <thead className="bg-muted text-2xs text-muted-foreground [&_th]:h-10 [&_th]:border-y [&_th]:border-border [&_th]:px-3 [&_th]:font-medium">
        <tr>
          <th scope="col">Asset</th>
          <th scope="col">Category</th>
          <th scope="col">Location</th>
          <th scope="col">Purchase Date</th>
          <th scope="col">Age</th>
          <th scope="col">Condition</th>
          <th scope="col">Lifecycle Stage</th>
          <th scope="col">Warranty</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className="h-12 hover:bg-muted"
          >
            <td className={cell}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground"
                >
                  <BoxIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <span className="block font-semibold text-foreground">{row.name || "Unnamed asset"}</span>
                  <span className="block text-2xs tabular-nums text-muted-foreground">{row.asset_code || "—"}</span>
                </div>
              </div>
            </td>
            <td className={cell}>{row.category_name || "Uncategorized"}</td>
            <td className={cell}>{row.location_name || "—"}</td>
            <td className={`${cell} whitespace-nowrap`}>{date(row.purchase_date)}</td>
            <td className={`${cell} whitespace-nowrap tabular-nums`}>{assetAge(row.purchase_date, today) ?? "—"}</td>
            <td className={cell}>
              {ASSET_CONDITIONS.includes(row.condition as AssetCondition) ? (
                <ConditionBadge condition={row.condition as AssetCondition} />
              ) : (
                <span className="text-muted-foreground">{row.condition || "—"}</span>
              )}
            </td>
            <td className={cell}>
              {ASSET_STATUSES.includes(row.status as AssetStatus) ? (
                <StatusBadge status={row.status as AssetStatus} />
              ) : (
                <span className="text-muted-foreground">{row.status || "—"}</span>
              )}
            </td>
            <td className={cell}>
              {row.current_warranty ? (
                <div className="space-y-1">
                  <span className="block whitespace-nowrap">{date(row.current_warranty.endDate)}</span>
                  <WarrantyBadge status={row.current_warranty.status} />
                </div>
              ) : (
                <WarrantyBadge status="No Warranty" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
