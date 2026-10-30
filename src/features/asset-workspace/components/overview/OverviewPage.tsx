// Asset Workspace Overview (FigJam 445:833; scope in E:\ThunderOne\docs\asset-ws-overview-fe-checklist.md §1).
// Each widget gets its own data or `null` (Core failed) and renders its own error / empty state.
// Waiting on the Lead: "vs last month" on the tiles and Quick Actions (not here), Assets on Map
// and Alerts & Notifications (layout mockups only, OverviewMockups.tsx).
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { StatTile } from "@/components/ui/StatTile";
import type { AssetStatus } from "../../domain/asset-status";
import { attentionRows, breakdown, kpiFromCounts, type AttentionRow, type BreakdownInput, type BreakdownRow } from "../../domain/overview";
import { STATUS_TONE, type StatusTone } from "../../domain/status-tone";
import type { ActivityEntry } from "../../services/asset-overview-api";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";
import { AlertsMockup, MapMockup } from "./OverviewMockups";

const BASE = "/asset-workspace";

export interface OverviewData {
  statusCounts: Partial<Record<AssetStatus, number>> | null;
  categories: BreakdownInput[] | null;
  locations: BreakdownInput[] | null;
  warranties: AttentionRow[] | null;
  maintenance: AttentionRow[] | null;
  activity: ActivityEntry[] | null;
}

export function OverviewPage({ data }: { data: OverviewData }) {
  const kpi = data.statusCounts && kpiFromCounts(data.statusCounts);
  const total = kpi?.total ?? 0;

  return (
    <div className="space-y-3 p-6">
      <PageHeader
        title="Overview"
        subtitle="Asset status and what needs attention in your organization"
        actions={
          <Button asChild>
            <Link href={`${BASE}/assets/register`}>
              <PlusIcon className="h-4 w-4" />
              Register Asset
            </Link>
          </Button>
        }
      />

      {kpi ? (
        <KpiRow
          total={kpi.total}
          tiles={kpi.tiles}
        />
      ) : (
        <Card className="p-4">
          <ErrorState title="Couldn't load asset counts" />
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Widget title="Assets by Category">
          <BreakdownBody
            items={kpi && data.categories}
            total={total}
            filterParam="category_id"
            chart="donut"
          />
        </Widget>
        <Widget
          title="Assets by Location"
          viewAll={`${BASE}/locations`}
        >
          <BreakdownBody
            items={kpi && data.locations}
            total={total}
            filterParam="location_id"
            chart="bars"
          />
        </Widget>
        <Widget
          title="Assets on Map"
          viewAll={`${BASE}/locations`}
        >
          <MapMockup />
        </Widget>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Widget
          title="Assets Needing Attention"
          viewAll={`${BASE}/lifecycle-warranty`}
        >
          <AttentionBody warranties={data.warranties} maintenance={data.maintenance} />
        </Widget>
        <Widget title="Recent Activities">
          <ActivityBody entries={data.activity} />
        </Widget>
        <Widget title="Alerts & Notifications">
          <AlertsMockup />
        </Widget>
      </div>
    </div>
  );
}

// Tile colours follow the one status map (ADR 0098 §3).
const TILE_COLOR = {
  green: "emerald",
  blue: "blue",
  yellow: "amber",
  red: "red",
  zinc: "zinc",
} as const satisfies Record<StatusTone, string>;

function KpiRow({ total, tiles }: ReturnType<typeof kpiFromCounts>) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Link href={`${BASE}/assets`}>
        <StatTile
          label="Total Assets"
          value={total.toLocaleString()}
        />
      </Link>
      {tiles.map((tile) => (
        <Link
          key={tile.status}
          href={`${BASE}/assets?status=${encodeURIComponent(tile.status)}`}
        >
          <StatTile
            label={tile.status}
            value={tile.count.toLocaleString()}
            hint={`${tile.percent}%`}
            color={TILE_COLOR[STATUS_TONE[tile.status]]}
          />
        </Link>
      ))}
    </div>
  );
}

function Widget({ title, viewAll, children }: { title: string; viewAll?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {viewAll && (
          <Link
            href={viewAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ChevronRightIcon className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

// Categories and locations are taxonomy, not status (DS-04): one brand ramp, grey for the buckets.
const RAMP = ["700", "600", "500", "400", "300", "200"].map((step) => `var(--color-t1-blue-${step})`);
const BUCKET_COLOR = "var(--color-t1-gray-300)";

function BreakdownBody({
  items,
  total,
  filterParam,
  chart,
}: {
  items: BreakdownInput[] | null;
  total: number;
  filterParam: "category_id" | "location_id";
  chart: "donut" | "bars";
}) {
  if (!items) return <ErrorState />;
  const rows = breakdown(items, total);
  if (rows.length === 0) return <EmptyState title="No assets yet" body="Counts appear once assets are registered." />;

  const colorOf = (row: BreakdownRow, i: number) => (row.id ? RAMP[i] : BUCKET_COLOR);
  const max = Math.max(...rows.map((r) => r.count));

  return (
    <div className="flex items-center gap-6">
      {chart === "donut" && (
        <DonutChart
          segments={rows.map((row, i) => ({ label: row.label, value: row.count, color: colorOf(row, i) }))}
          size={140}
        />
      )}
      <ul className="min-w-0 flex-1 divide-y divide-border">
        {rows.map((row, i) => {
          const label = row.id ? (
            <Link
              href={`${BASE}/assets?${filterParam}=${row.id}`}
              className="truncate hover:underline"
            >
              {row.label}
            </Link>
          ) : (
            <span className="truncate text-muted-foreground">{row.label}</span>
          );
          return (
            <li
              key={row.id ?? row.label}
              className="flex items-center gap-3 py-1.5 text-sm"
            >
              {chart === "donut" && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorOf(row, i) }}
                />
              )}
              <span className={chart === "bars" ? "w-40 min-w-0 truncate" : "min-w-0 flex-1 truncate"}>{label}</span>
              {chart === "bars" && (
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(row.count / max) * 100}%`, backgroundColor: colorOf(row, i) }}
                  />
                </span>
              )}
              <span className="w-10 text-right tabular-nums text-foreground">{row.count}</span>
              <span className="w-12 text-right tabular-nums text-muted-foreground">{row.percent}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function AttentionBody({ warranties, maintenance }: { warranties: AttentionRow[] | null; maintenance: AttentionRow[] | null }) {
  // Either half failing is shown as an error: a partial list would read as "nothing else needs attention".
  if (!warranties || !maintenance) return <ErrorState />;
  const rows = attentionRows(warranties, maintenance);
  if (rows.length === 0) return <EmptyState title="Nothing needs attention" body="No warranties end in the next 30 days and no assets are in maintenance." />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pb-2 font-medium">Asset</th>
          <th className="pb-2 font-medium">Status</th>
          <th className="hidden pb-2 font-medium md:table-cell">Location</th>
          <th className="pb-2 text-right font-medium">Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={`${row.reason}-${row.assetId}`}>
            <td className="py-2">
              <Link
                href={`${BASE}/assets/${row.assetId}`}
                className="block truncate font-medium text-foreground hover:underline"
              >
                {row.assetName}
              </Link>
              <span className="text-xs text-muted-foreground">{[row.assetCode, row.category].filter(Boolean).join(" · ")}</span>
            </td>
            <td className="py-2">
              <Badge
                variant="pill"
                color={row.reason === "In Maintenance" ? STATUS_TONE["In Maintenance"] : "yellow"}
              >
                {row.reason}
              </Badge>
            </td>
            <td className="hidden py-2 text-muted-foreground md:table-cell">{row.location ?? "—"}</td>
            <td className="py-2 text-right tabular-nums text-muted-foreground">
              {row.reason === "In Maintenance" ? "Since " : "Ends "}
              {dateFmt.format(new Date(row.date))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActivityBody({ entries }: { entries: ActivityEntry[] | null }) {
  if (!entries) return <ErrorState />;
  if (entries.length === 0) return <EmptyState title="No activity yet" body="Asset changes appear here as they happen." />;

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start justify-between gap-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{entry.summary ?? entry.action}</p>
            {entry.assetId && entry.assetName && (
              <Link
                href={`${BASE}/assets/${entry.assetId}`}
                className="block truncate text-xs text-muted-foreground hover:underline"
              >
                {entry.assetName}
              </Link>
            )}
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p className="tabular-nums">{dateTimeFmt.format(new Date(entry.at))}</p>
            {entry.actorName && <p>{entry.actorName}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
