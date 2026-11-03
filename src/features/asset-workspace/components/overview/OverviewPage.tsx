// Asset Workspace Overview (FigJam 445:833; scope in E:\ThunderOne\docs\asset-ws-overview-fe-checklist.md §1).
// Each widget gets its own data or `null` (Core failed) and renders its own error / empty state.
// KPI "vs last month" shows once Core has last month's month-end rows. Quick Actions stay disabled until their
// pages ship. Connected Devices and Register Device are Phase 2 (checklist §1).
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import {
  AssignmentIcon,
  BoxIcon,
  BulkImportIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InventoryIcon,
  PlusIcon,
  RetireIcon,
  ToolIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { StatTile } from "@/components/ui/StatTile";
import type { AssetStatus } from "../../domain/asset-status";
import { attentionRows, breakdown, kpiFromCounts, type AttentionRow, type BreakdownInput, type BreakdownRow } from "../../domain/overview";
import { STATUS_TONE, type StatusTone } from "../../domain/status-tone";
import type { ActivityEntry, LocationCount } from "../../services/asset-overview-api";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";
import { AlertsPanel, type AlertItem } from "./AlertsPanel";
import { AssetMap } from "./AssetMap";

const BASE = "/asset-workspace";

export interface OverviewData {
  statusCounts: { now: Partial<Record<AssetStatus, number>>; lastMonth: Partial<Record<AssetStatus, number>> | null } | null;
  categories: BreakdownInput[] | null;
  locations: LocationCount[] | null;
  warranties: AttentionRow[] | null;
  maintenance: AttentionRow[] | null;
  activity: ActivityEntry[] | null;
}

export function OverviewPage({ data }: { data: OverviewData }) {
  const kpi = data.statusCounts && kpiFromCounts(data.statusCounts.now, data.statusCounts.lastMonth);
  const total = kpi?.total ?? 0;

  return (
    <div className="space-y-3 p-6">
      <PageHeader
        title="Overview"
        subtitle="Asset status and what needs attention in your organization"
        actions={
          <div className="flex">
            <RegisterAssetButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="More actions"
                  className="rounded-l-none border-l border-primary-foreground/30 px-2"
                >
                  <ChevronDownIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {QUICK_ACTIONS.slice(1).map(({ label, href, Icon, ready }) =>
                  ready ? (
                    <DropdownMenuItem
                      key={label}
                      asChild
                    >
                      <Link href={href}>
                        <Icon />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      key={label}
                      disabled
                    >
                      <Icon />
                      {label}
                      <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {kpi ? (
        <KpiRow {...kpi} />
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
          {data.locations ? <AssetMap locations={data.locations} /> : <ErrorState />}
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
          {data.warranties && data.maintenance ? (
            <AlertsPanel items={alertItems(data.warranties, data.maintenance)} />
          ) : (
            <ErrorState />
          )}
        </Widget>
      </div>

      <QuickActions />
    </div>
  );
}

// Lead (2026-11-02): keep these four; an action whose page isn't built yet stays disabled. Set `ready`
// when its page replaces the ScreenPlaceholder.
const QUICK_ACTIONS = [
  { label: "Register Asset", href: `${BASE}/assets/register`, Icon: PlusIcon, primary: true, ready: false },
  { label: "Assign Asset", href: `${BASE}/assignments`, Icon: AssignmentIcon, ready: false },
  { label: "Start Inventory", href: `${BASE}/inventory`, Icon: InventoryIcon, ready: false },
  { label: "Import Data", href: `${BASE}/assets/import`, Icon: BulkImportIcon, ready: false },
];

// Header split button: main part opens Register Asset, the chevron lists the other Quick Actions.
function RegisterAssetButton() {
  const { label, href, Icon, ready } = QUICK_ACTIONS[0];
  const content = (
    <>
      <Icon className="h-4 w-4" />
      {label}
    </>
  );
  return ready ? (
    <Button
      asChild
      className="rounded-r-none"
    >
      <Link href={href}>{content}</Link>
    </Button>
  ) : (
    <Button
      disabled
      title="Coming soon"
      className="rounded-r-none"
    >
      {content}
    </Button>
  );
}

function QuickActions() {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map(({ label, href, Icon, primary, ready }) => {
          const card = (
            <Card className={`flex items-center gap-3 p-3 transition-colors ${ready ? "hover:bg-muted" : "opacity-50"}`}>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                  primary ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
                }`}
              >
                <Icon />
              </span>
              <span className="text-sm font-medium text-primary">{label}</span>
            </Card>
          );
          return ready ? (
            <Link
              key={label}
              href={href}
            >
              {card}
            </Link>
          ) : (
            <div
              key={label}
              aria-disabled="true"
              title="Coming soon"
              className="cursor-not-allowed"
            >
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const DAY_MS = 86_400_000;
const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

// Built on the server, so "today" is the request time; the client panel only switches tabs.
function alertItems(warranties: AttentionRow[], maintenance: AttentionRow[]): AlertItem[] {
  const now = Date.now();
  const detail = (row: AttentionRow) => [row.assetTag, row.location].filter(Boolean).join(" · ");
  return [
    ...warranties.map((row) => {
      const left = Math.max(Math.ceil((Date.parse(row.date) - now) / DAY_MS), 0);
      return {
        key: `w-${row.assetId}`,
        kind: "Warranty" as const,
        title: `${row.assetName} warranty expiring`,
        detail: detail(row),
        href: `${BASE}/assets/${row.assetId}`,
        due: left === 0 ? "Today" : `${days(left)} left`,
      };
    }),
    ...maintenance.map((row) => ({
      key: `m-${row.assetId}`,
      kind: "Maintenance" as const,
      title: `${row.assetName} in maintenance`,
      detail: detail(row),
      href: `${BASE}/assets/${row.assetId}`,
      due: `for ${days(Math.max(Math.floor((now - Date.parse(row.date)) / DAY_MS), 0))}`,
    })),
  ];
}

// Tile colours follow the one status map (ADR 0098 §3).
const TILE_COLOR = {
  green: "emerald",
  blue: "blue",
  yellow: "amber",
  red: "red",
  zinc: "zinc",
} as const satisfies Record<StatusTone, string>;

// ADR 0098 §4 icon map: Assets, Assignments, Maintenance, Retire; Available uses the platform success glyph.
const TILE_ICON = {
  Available: CheckCircleIcon,
  Assigned: AssignmentIcon,
  "In Maintenance": ToolIcon,
  Retired: RetireIcon,
} as const;

/** "+12 vs last month"; nothing until last month has a snapshot. */
const vsLastMonth = (delta: number | null) => (delta === null ? undefined : `${delta > 0 ? "+" : ""}${delta.toLocaleString()} vs last month`);

function KpiRow({ total, totalDelta, tiles }: ReturnType<typeof kpiFromCounts>) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Link href={`${BASE}/assets`}>
        <StatTile
          label="Total Assets"
          value={total.toLocaleString()}
          trend={vsLastMonth(totalDelta)}
          icon={<BoxIcon />}
        />
      </Link>
      {tiles.map((tile) => {
        const Icon = TILE_ICON[tile.status];
        return (
          <Link
            key={tile.status}
            href={`${BASE}/assets?status=${encodeURIComponent(tile.status)}`}
          >
            <StatTile
              label={tile.status}
              value={tile.count.toLocaleString()}
              hint={`${tile.percent}%`}
              trend={vsLastMonth(tile.delta)}
              color={TILE_COLOR[STATUS_TONE[tile.status]]}
              icon={<Icon />}
            />
          </Link>
        );
      })}
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

// Categories and locations are taxonomy, not status (DS-04): brand blue and purple only, so no slice reads as
// green/amber/red. Grey for the Others and Unassigned buckets. Text classes painted through `currentColor`:
// the theme is `@theme inline`, so `var(--color-t1-*)` is not emitted for the SVG fills.
const RAMP = ["text-t1-blue-600", "text-t1-purple-500", "text-t1-blue-300", "text-t1-purple-700", "text-t1-blue-800", "text-t1-purple-300"];
const BUCKET_COLOR = "text-t1-gray-300";

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
    <div className="flex items-center gap-5">
      {chart === "donut" && (
        <div className="relative shrink-0">
          <DonutChart
            segments={rows.map((row, i) => ({ label: row.label, value: row.count, color: "currentColor", colorClass: colorOf(row, i) }))}
            size={120}
            strokeWidth={22}
            seamless
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{total.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Assets</span>
          </div>
        </div>
      )}
      <ul className={chart === "donut" ? "min-w-0 flex-1" : "min-w-0 flex-1 divide-y divide-border"}>
        {rows.map((row, i) => {
          const label = row.id ? (
            <Link
              href={`${BASE}/assets?${filterParam}=${row.id}`}
              className="hover:underline"
            >
              {row.label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{row.label}</span>
          );
          return (
            <li
              key={row.id ?? row.label}
              className="flex items-center gap-2 py-1.5 text-sm"
            >
              {chart === "donut" && <span className={`h-3 w-3 shrink-0 rounded-full bg-current ${colorOf(row, i)}`} />}
              {/* Donut legend wraps long names: beside the chart a third-width card leaves too little room to truncate. */}
              <span className={chart === "bars" ? "w-40 min-w-0 truncate" : "min-w-0 flex-1 break-words leading-tight"}>{label}</span>
              {chart === "bars" && (
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={`block h-full rounded-full bg-current ${colorOf(row, i)}`}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
              )}
              <span className="w-8 text-right tabular-nums text-foreground">{row.count}</span>
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
              <span className="text-xs text-muted-foreground">{[row.assetTag, row.category].filter(Boolean).join(" · ")}</span>
            </td>
            <td className="py-2">
              <Badge
                variant="pill"
                color={row.reason === "In Maintenance" ? STATUS_TONE["In Maintenance"] : "yellow"}
                className="whitespace-nowrap"
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
