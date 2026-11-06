import {
  AssignmentIcon, BoxIcon, CheckCircleIcon, DisposeIcon, RetireIcon, ToolIcon,
} from "@/components/ui/icons";
import { StatTile } from "@/components/ui/StatTile";
import { ASSET_STATUSES } from "../../domain/asset-status";
import { STATUS_TONE, type StatusTone } from "../../domain/status-tone";
import type { AssetReadResult, AssetSummaryData } from "../../services/assets-list-types";
import { ErrorState } from "../states/ErrorState";

const summaryIcons = {
  Available: CheckCircleIcon, Assigned: AssignmentIcon, "In Maintenance": ToolIcon,
  Retired: RetireIcon, Disposed: DisposeIcon,
};
// StatTile colour per status tone, as the Overview KPI row (ADR 0098 §3).
const tileColor = {
  green: "emerald", blue: "blue", yellow: "amber", red: "red", zinc: "zinc",
} as const satisfies Record<StatusTone, string>;
const number = new Intl.NumberFormat("en-GB");
// Match Overview's one-decimal percentages without adding a trailing zero.
const percentage = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

export function AssetsSummary({ result }: { result: AssetReadResult<AssetSummaryData> }) {
  if (!result.ok) {
    return <ErrorState title="Couldn't load asset totals" body={result.message} />;
  }

  return (
    <section aria-label="Asset totals for this organization" className="space-y-2">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-6">
        <StatTile
          label="Total Assets"
          value={number.format(result.data.total)}
          trend="All statuses"
          icon={<BoxIcon />}
        />
        {ASSET_STATUSES.map((status) => {
          const bucket = result.data.byStatus.find((entry) => entry.status === status);
          const Icon = summaryIcons[status];
          return (
            <StatTile
              key={status}
              label={status}
              value={number.format(bucket?.count ?? 0)}
              hint={`${percentage.format(bucket?.percent ?? 0)}%`}
              color={tileColor[STATUS_TONE[status]]}
              icon={<Icon />}
            />
          );
        })}
      </div>
      {result.data.unmapped > 0 && (
        <p role="status" className="rounded-control bg-warning-muted p-3 text-xs text-foreground">
          {number.format(result.data.unmapped)} {result.data.unmapped === 1 ? "asset has" : "assets have"} an unmapped lifecycle status. Included in Total Assets, outside the five status counts.
        </p>
      )}
    </section>
  );
}
