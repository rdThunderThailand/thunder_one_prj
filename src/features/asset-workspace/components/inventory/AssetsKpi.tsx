// KPI row of the session Assets tab (05 §4.9): a progress ring and four tiles from the session `counts`. Percentages are
// shares of the frozen Total. Discrepancies = Mismatch + Not Found + Unexpected (the same rule as the Overview).
import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckCircleIcon, ClockIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { sessionProgress, type SessionDetail } from "../../domain/inventory";
import { INVENTORY_RESULT_TONE } from "../../domain/status-tone";
import { KpiTile, toneTile } from "./kpi-tile";

const pct = (n: number, total: number) => `${total ? Math.round((n / total) * 1000) / 10 : 0}%`;

function Ring({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(value, 0), 100) / 100)}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{value}%</span>
    </div>
  );
}

export function AssetsKpi({ counts }: { counts: SessionDetail["counts"] }) {
  const { done, pct: progress, discrepancies } = sessionProgress(counts);
  const total = counts.expected;
  return (
    <Card className="grid gap-4 p-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <div className="space-y-3">
        <h2 className="font-semibold">Verification Progress</h2>
        <div className="flex items-center gap-4">
          <Ring value={progress} />
          <p>
            <span className="block text-2xl font-semibold tabular-nums">
              {done.toLocaleString()} / {total.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">Assets checked</span>
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={<CheckCircleIcon />}
          {...toneTile(INVENTORY_RESULT_TONE.Verified)}
          value={counts.verified}
          label="Verified"
          note={pct(counts.verified, total)}
        />
        <KpiTile
          icon={<WarningTriangleIcon />}
          {...toneTile(INVENTORY_RESULT_TONE.Mismatch)}
          value={discrepancies}
          label="Discrepancies"
          note={pct(discrepancies, total)}
        />
        <KpiTile
          icon={<ClockIcon />}
          {...toneTile("zinc")}
          value={counts.remaining}
          label="Remaining"
          note={pct(counts.remaining, total)}
        />
        <KpiTile
          icon={<BoxIcon />}
          iconClass="text-t1-purple-700"
          tint="bg-t1-purple-50"
          value={total}
          label="Total Assets"
          note={total ? "100%" : "0%"}
        />
      </div>
    </Card>
  );
}
