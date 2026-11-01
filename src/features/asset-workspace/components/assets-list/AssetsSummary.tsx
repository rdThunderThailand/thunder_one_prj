import {
  AssignmentIcon, BoxIcon, CheckCircleIcon, DisposeIcon, RetireIcon, ToolIcon,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { ASSET_STATUSES } from "../../domain/asset-status";
import { STATUS_TONE } from "../../domain/status-tone";
import type { AssetReadResult, AssetSummaryData } from "../../services/assets-list-types";
import { ErrorState } from "../states/ErrorState";

const summaryIcons = {
  Available: CheckCircleIcon, Assigned: AssignmentIcon, "In Maintenance": ToolIcon,
  Retired: RetireIcon, Disposed: DisposeIcon,
};
const toneClasses = { green: "bg-success-muted text-success", blue: "bg-info-muted text-info", yellow: "bg-warning-muted text-warning", red: "bg-error-muted text-error", zinc: "bg-muted text-muted-foreground" };
const number = new Intl.NumberFormat("en-GB");

export function AssetsSummary({ result }: { result: AssetReadResult<AssetSummaryData> }) {
  if (!result.ok) {
    return <ErrorState title="Couldn't load asset totals" body={result.message} />;
  }
  const cards = [
    { label: "Total Assets", count: result.data.total, percent: null, icon: BoxIcon, tone: "bg-info-muted text-info" },
    ...ASSET_STATUSES.map((status) => {
      const bucket = result.data.byStatus.find((entry) => entry.status === status);
      return { label: status, count: bucket?.count ?? 0, percent: bucket?.percent ?? 0, icon: summaryIcons[status], tone: toneClasses[STATUS_TONE[status]] };
    }),
  ];

  return (
    <section aria-label="Asset totals for this organization" className="space-y-2">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-6">
        {cards.map(({ label, count, percent, icon: Icon, tone }) => (
          <Card key={label} className="flex min-h-24 items-start gap-3 p-3">
            <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-foreground">{label}</h2>
              <p className="mt-1 text-kpi font-bold leading-tight tabular-nums text-foreground">{number.format(count)}</p>
              {percent !== null && (
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">{percent.toFixed(1)}%</p>
              )}
            </div>
          </Card>
        ))}
      </div>
      {result.data.unmapped > 0 && (
        <p role="status" className="rounded-control bg-warning-muted p-3 text-xs text-foreground">
          {number.format(result.data.unmapped)} {result.data.unmapped === 1 ? "asset has" : "assets have"} an unmapped lifecycle status. Included in Total Assets, outside the five status counts.
        </p>
      )}
    </section>
  );
}
