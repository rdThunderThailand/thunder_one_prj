// Reports page building blocks (PO 05 §4.13.5). Server components: the tab pages render them and hand the
// result to the client list scaffold as its `nav` / `summary` slots. Colours come from domain/status-tone.ts.
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { AssignmentIcon, BoxIcon, CalendarIcon, ChartIcon, CheckCircleIcon, ClockIcon, DisposeIcon, DownloadIcon, RetireIcon, ToolIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { StatTile } from "@/components/ui/StatTile";
import { ASSET_STATUSES } from "../../domain/asset-status";
import { ATTENTION_ISSUES, POOR_CONDITIONS, REPORT_TABS, formatAverageAge, type AttentionIssue } from "../../domain/report";
import { STATUS_TONE, type StatusTone } from "../../domain/status-tone";
import type { LastMonthCounts, LifecycleReport, ReportResult, StatusCounts } from "../../services/asset-reports-api";
import { TILE_COLOR, vsLastMonth } from "../overview/OverviewPage";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";

export const REPORTS_BASE = "/asset-workspace/reports";

/** Share of total, one decimal; 0 when total is 0. */
export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

// Slices and bar segments paint through `currentColor` (see OverviewPage RAMP).
const TONE_TEXT: Record<StatusTone, string> = {
  green: "text-success",
  blue: "text-info",
  yellow: "text-warning",
  red: "text-error",
  zinc: "text-t1-gray-400",
};

export function ReportTabs({ active }: { active: (typeof REPORT_TABS)[number]["key"] }) {
  return (
    <nav
      aria-label="Reports"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {REPORT_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`${REPORTS_BASE}/${tab.key}`}
          aria-current={tab.key === active ? "page" : undefined}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
            tab.key === active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** CSV only (UC-014). Disabled until Core ships `reports/{reportType}/export`, which waits on D16 (field allowlist). */
export function ExportCsvButton() {
  return (
    <Button
      variant="outline"
      disabled
      title="CSV export is coming soon"
    >
      <DownloadIcon className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

/** "unavailable" = Core hasn't built the route yet; `null` = the call failed. */
export function ReportBody<T>({ data, children }: { data: ReportResult<T>; children: (data: T) => ReactNode }) {
  if (data === "unavailable") return <NotAvailable />;
  if (data === null) return <ErrorState />;
  return children(data);
}

export function NotAvailable() {
  return (
    <EmptyState
      title="Report not available yet"
      body="This report appears once its data service is ready."
    />
  );
}

interface Kpi {
  label: string;
  /** `null` = Core doesn't send it yet ("—"). */
  value: number | string | null;
  hint?: string;
  trend?: string;
  tone?: StatusTone;
  icon?: ReactNode;
}

export function KpiGrid({ tiles }: { tiles: Kpi[] }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${tiles.length === 4 ? "xl:grid-cols-4" : "md:grid-cols-3 xl:grid-cols-6"}`}>
      {tiles.map((tile) => (
        <StatTile
          key={tile.label}
          label={tile.label}
          value={tile.value === null ? "—" : tile.value.toLocaleString()}
          hint={tile.hint}
          trend={tile.trend}
          color={tile.tone && TILE_COLOR[tile.tone]}
          icon={tile.icon}
        />
      ))}
    </div>
  );
}

const STATUS_ICON = {
  Available: CheckCircleIcon,
  Assigned: AssignmentIcon,
  "In Maintenance": ToolIcon,
  Retired: RetireIcon,
  Disposed: DisposeIcon,
} as const;

/** Total + one tile per status. On Reports, Total counts all five statuses, Disposed included.
 *  "vs last month" shows only when Core sends `lastMonth` (never while a filter is set). */
export function StatusKpis({ data }: { data: ReportResult<{ total: number; byStatus: StatusCounts; lastMonth?: LastMonthCounts | null }> }) {
  if (data === "unavailable" || data === null) {
    return (
      <Card className="p-4">
        <ReportBody data={data}>{() => null}</ReportBody>
      </Card>
    );
  }
  const last = data.lastMonth;
  return (
    <KpiGrid
      tiles={[
        { label: "Total Assets", value: data.total, trend: last ? vsLastMonth(data.total - last.total) : undefined, icon: <BoxIcon /> },
        ...ASSET_STATUSES.map((status) => {
          const Icon = STATUS_ICON[status];
          const count = data.byStatus[status] ?? 0;
          const trend = last ? vsLastMonth(count - (last.byStatus[status] ?? 0)) : undefined;
          return { label: status, value: count, hint: `${pct(count, data.total)}%`, trend, tone: STATUS_TONE[status], icon: <Icon /> };
        }),
      ]}
    />
  );
}

/** Lifecycle tab KPIs as in Figma: Total · Near End of Life · Poor Condition · Average Asset Age.
 *  Provisional rules (domain/report.ts); Near End of Life and age come from Core PR 7 and show "—" until then. */
export function LifecycleKpis({ data }: { data: ReportResult<LifecycleReport> }) {
  if (data === "unavailable" || data === null) return <StatusKpis data={data} />;
  const poor = POOR_CONDITIONS.reduce((sum, c) => sum + (data.byCondition[c] ?? 0), 0);
  const near = data.nearEndOfLife ?? null;
  const last = data.lastMonth;
  return (
    <KpiGrid
      tiles={[
        { label: "Total Assets", value: data.total, trend: last ? vsLastMonth(data.total - last.total) : undefined, icon: <BoxIcon /> },
        { label: "Near End of Life", value: near, hint: near === null ? "Not available yet" : `${pct(near, data.total)}% of total`, tone: "yellow", icon: <ClockIcon /> },
        { label: "Poor Condition", value: poor, hint: `${pct(poor, data.total)}% of total`, tone: "red", icon: <WarningTriangleIcon /> },
        {
          label: "Average Asset Age",
          value: formatAverageAge(data.age?.averageMonths ?? null),
          hint: data.age ? `${data.age.counted.toLocaleString()} with acquisition date` : "Not available yet",
          tone: "blue",
          icon: <ChartIcon />,
        },
      ]}
    />
  );
}

/** Period filter from Figma. Disabled until reports take a date range (Lead 2026-11-04). */
export function PeriodButton() {
  return (
    <Button
      variant="outline"
      disabled
      title="Period filter is coming soon"
    >
      <CalendarIcon className="h-4 w-4" />
      Last 12 Months
    </Button>
  );
}

const ISSUE_TONE: Record<AttentionIssue, StatusTone> = {
  "Near End of Life": "yellow",
  "Poor Condition": "red",
  "Warranty Expiring": "blue",
};

/** Category × issue counts, largest first. */
export function AttentionTable({ rows, total }: { rows: NonNullable<LifecycleReport["attention"]>; total: number }) {
  if (rows.length === 0) return <EmptyState title="Nothing needs attention" body="No assets match these issues." />;
  const sorted = [...rows].sort((a, b) => b.count - a.count || ATTENTION_ISSUES.indexOf(a.issue) - ATTENTION_ISSUES.indexOf(b.issue));
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-muted-foreground">
        <tr>
          <th className="pb-2 font-medium">Category</th>
          <th className="pb-2 font-medium">Issue</th>
          <th className="w-16 pb-2 text-right font-medium">Count</th>
          <th className="w-16 pb-2 text-right font-medium">% of Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {sorted.map((row) => (
          <tr key={`${row.categoryId ?? "none"}:${row.issue}`}>
            <td className="py-1.5">{row.category}</td>
            <td className="py-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full bg-current ${TONE_TEXT[ISSUE_TONE[row.issue]]}`} />
                {row.issue}
              </span>
            </td>
            <td className="py-1.5 text-right tabular-nums">{row.count.toLocaleString()}</td>
            <td className="py-1.5 text-right tabular-nums text-muted-foreground">{pct(row.count, total)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Widget({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {/* Cards in a row stretch to the tallest; the body sits centred in the spare height. */}
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </Card>
  );
}

/** Donut + legend over a fixed set of keys, each coloured by its tone. */
export function ToneDonut<K extends string>({
  counts,
  order,
  tone,
  unit = "Assets",
}: {
  counts: Partial<Record<K, number>>;
  order: readonly K[];
  tone: Record<K, StatusTone>;
  unit?: string;
}) {
  const total = order.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  if (total === 0) return <EmptyState title="Nothing to show" body="No records match these filters." />;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0">
        <DonutChart
          segments={order.map((key) => ({ label: key, value: counts[key] ?? 0, color: "currentColor", colorClass: TONE_TEXT[tone[key]] }))}
          size={120}
          strokeWidth={22}
          seamless
          // Above the centre label, so the hover tooltip is not covered by it.
          className="relative z-10"
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{total.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <ul className="min-w-40 flex-1">
        {order.map((key) => (
          <li
            key={key}
            className="flex items-center gap-2 py-1 text-sm"
          >
            <span className={`h-3 w-3 shrink-0 rounded-full bg-current ${TONE_TEXT[tone[key]]}`} />
            <span className="min-w-0 flex-1">{key}</span>
            <span className="w-12 text-right tabular-nums text-foreground">{(counts[key] ?? 0).toLocaleString()}</span>
            <span className="w-12 text-right tabular-nums text-muted-foreground">{pct(counts[key] ?? 0, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One stacked bar per row (e.g. category), segments in `order`, scaled to the largest row. */
export function StackedBars<K extends string>({
  rows,
  order,
  tone,
}: {
  rows: { id: string; name: string; counts: Partial<Record<K, number>> }[];
  order: readonly K[];
  tone: Record<K, StatusTone>;
}) {
  if (rows.length === 0) return <EmptyState title="Nothing to show" body="No records match these filters." />;
  const totalOf = (counts: Partial<Record<K, number>>) => order.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  const max = Math.max(...rows.map((row) => totalOf(row.counts)), 1);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-32 min-w-0 truncate">{row.name}</span>
            <span className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              {order.map((key) => (
                <span
                  key={key}
                  title={`${key}: ${row.counts[key] ?? 0}`}
                  className={`h-full bg-current ${TONE_TEXT[tone[key]]}`}
                  style={{ width: `${((row.counts[key] ?? 0) / max) * 100}%` }}
                />
              ))}
            </span>
            <span className="w-12 text-right tabular-nums text-foreground">{totalOf(row.counts).toLocaleString()}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {order.map((key) => (
          <li
            key={key}
            className="flex items-center gap-1.5"
          >
            <span className={`h-2.5 w-2.5 rounded-full bg-current ${TONE_TEXT[tone[key]]}`} />
            {key}
          </li>
        ))}
      </ul>
    </div>
  );
}
