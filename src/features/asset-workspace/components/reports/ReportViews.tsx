"use client";

// Client halves of the Reports tabs. Asset Summary reuses the Assets page's table, Lifecycle has its own; the others declare their columns
// (functions can't cross from a Server Component) and render the list scaffold. Header slots (tabs, charts, export) arrive pre-rendered from the page.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import type { AssetsListUrlState } from "../../hooks/use-assets-list-url";
import { INVENTORY_RESULTS, SESSION_STATUSES, WARRANTY_STATUSES } from "../../domain/report";
import { SESSION_STATUS_TONE, WARRANTY_TONE } from "../../domain/status-tone";
import type { SessionRow, WarrantyRow } from "../../services/asset-reports-api";
import type { AssetFilterOptions, AssetListData } from "../../services/assets-list-types";
import { AssetsFilters } from "../assets-list/AssetsFilters";
import { AssetsTableLoading } from "../assets-list/AssetsListLoading";
import { AssetsPagination } from "../assets-list/AssetsPagination";
import { AssetsTable } from "../assets-list/AssetsTable";
import { AssetWorkspaceListPage, type ListColumn, type ListData } from "../list-page/AssetWorkspaceListPage";
import { useListUrlState } from "../list-page/useListUrlState";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";
import { LifecycleTable } from "./LifecycleTable";
import { ReportFilterBar, type FilterOption } from "./ReportFilterBar";

const BASE = "/asset-workspace";

interface Slots {
  nav: ReactNode;
  summary: ReactNode;
  primaryAction: ReactNode;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const date = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");
const fixed = (values: readonly string[]): FilterOption[] => values.map((value) => ({ value, label: value }));

const NOT_AVAILABLE = { emptyTitle: "Report not available yet", emptyBody: "This report appears once its data service is ready." };

// ── Asset Summary + Lifecycle & Condition: the Assets page's table, filters and pagination ──

const NO_SELECTION = new Set<string>();
const noop = () => {};
export function AssetReportView({
  slots,
  subtitle,
  data,
  filters,
  lifecycleColumns = false,
}: {
  slots: Slots;
  subtitle: string;
  /** Lifecycle & Condition tab: its own details table instead of the Assets page's. */
  lifecycleColumns?: boolean;
  /** `null` means the `assets/list` fetch failed. */
  data: AssetListData | null;
  filters: AssetFilterOptions | null;
}) {
  return (
    <div className="@container space-y-3 p-6">
      <PageHeader
        title="Reports"
        subtitle={subtitle}
        actions={slots.primaryAction}
      />
      {slots.nav}
      {slots.summary}
      <AssetsTableSection
        data={data}
        filters={filters}
        lifecycleColumns={lifecycleColumns}
      />
    </div>
  );
}

/** Assets page filters + table + pagination over URL state, read-only (no selection). Shared by the Reports asset tabs
 *  and the Location Detail Assets tab, which passes `lockedLocationId`: the Location filter then shows that location and
 *  ignores changes (the server page always queries it). */
export function AssetsTableSection({
  data,
  filters,
  lifecycleColumns = false,
  lockedLocationId,
}: {
  data: AssetListData | null;
  filters: AssetFilterOptions | null;
  lifecycleColumns?: boolean;
  lockedLocationId?: string;
}) {
  const list = useListUrlState();
  const searchParams = useSearchParams();
  // AssetsFilters reads only get / set / isPending. Our router-push URL state makes the server page re-fetch
  // the KPIs and charts too; the Assets page's own hook only rewrites history, which would leave them stale.
  const url: AssetsListUrlState = {
    ...list,
    get: (key) => (lockedLocationId && key === "location_id" ? lockedLocationId : list.get(key)),
    set: (updates) => {
      if (lockedLocationId) delete updates.location_id;
      list.set(updates);
    },
    search: searchParams.toString(),
    clear: noop,
    closeScan: noop,
  };
  const options =
    filters && lockedLocationId ? { ...filters, locations: filters.locations.filter((l) => l.id === lockedLocationId) } : filters;

  return (
    <>
      <AssetsFilters
        result={options ? { ok: true, data: options } : null}
        url={url}
      />
      <section
        aria-label="Assets"
        aria-busy={url.isPending}
        className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-card shadow-panel"
      >
        {url.isPending ? (
          <AssetsTableLoading />
        ) : !data ? (
          <ErrorState />
        ) : data.rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No assets match"
              body="Try clearing a filter."
            />
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            {lifecycleColumns ? (
              <LifecycleTable rows={data.rows} />
            ) : (
              // Read-only: no bulk actions, so selection stays off.
              <AssetsTable
                rows={data.rows}
                selected={NO_SELECTION}
                pending
                onSelect={noop}
                onSelectAll={noop}
              />
            )}
          </div>
        )}
        {data && (
          <div className="border-t border-border px-3 py-2">
            <AssetsPagination
              data={data}
              pending={url.isPending}
              onPage={(page) => url.set({ page: String(page) })}
              onPageSize={(size) => url.set({ pageSize: String(size) })}
            />
          </div>
        )}
      </section>
    </>
  );
}

// ── Inventory: sessions table ──

const SESSION_COLUMNS: ListColumn<SessionRow>[] = [
  {
    key: "name",
    header: "Session",
    render: (row) => (
      <Link
        href={`${BASE}/inventory/${row.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  { key: "ref", header: "Reference", render: (row) => row.referenceNo ?? "—", className: "whitespace-nowrap" },
  { key: "scope", header: "Location / Scope", render: (row) => row.scopeLabel },
  { key: "started", header: "Started", render: (row) => date(row.startedAt), className: "whitespace-nowrap" },
  { key: "completed", header: "Completed", render: (row) => date(row.completedAt), className: "whitespace-nowrap" },
  { key: "progress", header: "Progress", render: (row) => `${row.progressPct}%`, className: "text-right tabular-nums" },
  ...INVENTORY_RESULTS.map(
    (result): ListColumn<SessionRow> => ({
      key: result,
      header: result,
      render: (row) => (row.results[result] ?? 0).toLocaleString(),
      className: "text-right tabular-nums",
    }),
  ),
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge
        variant="pill"
        color={SESSION_STATUS_TONE[row.status]}
        className="whitespace-nowrap"
      >
        {row.status}
      </Badge>
    ),
  },
];

export function InventoryReportView({
  slots,
  data,
  unavailable,
  locations,
}: {
  slots: Slots;
  data: ListData<SessionRow> | null;
  unavailable: boolean;
  locations: FilterOption[];
}) {
  return (
    <AssetWorkspaceListPage
      title="Reports"
      subtitle="Inventory sessions, results and discrepancies"
      {...slots}
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search session name or reference"
          selects={[
            { key: "status", label: "Status", options: fixed(SESSION_STATUSES) },
            { key: "location_id", label: "Location", options: locations },
          ]}
          dateRange={{ label: "Started", from: "from", to: "to" }}
        />
      )}
      columns={SESSION_COLUMNS}
      data={data}
      getRowId={(row) => row.id}
      itemLabel="sessions"
      {...(unavailable ? NOT_AVAILABLE : { emptyTitle: "No sessions match", emptyBody: "Try clearing a filter." })}
    />
  );
}

// ── Warranty: assets with their current warranty ──

const WARRANTY_COLUMNS: ListColumn<WarrantyRow>[] = [
  {
    key: "name",
    header: "Asset",
    render: (row) => (
      <Link
        href={`${BASE}/assets/${row.assetId}`}
        className="font-medium text-foreground hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  { key: "tag", header: "Asset Tag", render: (row) => row.assetTag, className: "whitespace-nowrap" },
  { key: "category", header: "Category", render: (row) => row.category?.name ?? "—" },
  { key: "provider", header: "Provider", render: (row) => row.provider ?? "—" },
  { key: "type", header: "Warranty Type", render: (row) => row.warrantyType ?? "—" },
  { key: "start", header: "Start Date", render: (row) => date(row.startDate), className: "whitespace-nowrap" },
  { key: "end", header: "End Date", render: (row) => date(row.endDate), className: "whitespace-nowrap" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge
        variant="pill"
        color={WARRANTY_TONE[row.status]}
        className="whitespace-nowrap"
      >
        {row.status}
      </Badge>
    ),
  },
];

export function WarrantyReportView({
  slots,
  data,
  unavailable,
  providers,
}: {
  slots: Slots;
  data: ListData<WarrantyRow> | null;
  unavailable: boolean;
  providers: FilterOption[];
}) {
  return (
    <AssetWorkspaceListPage
      title="Reports"
      subtitle="Current warranty coverage and what expires next"
      {...slots}
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search name, asset tag or reference"
          selects={[
            { key: "status", label: "Status", options: fixed(WARRANTY_STATUSES) },
            { key: "provider", label: "Provider", options: providers },
          ]}
          dateRange={{ label: "Ends", from: "end_from", to: "end_to" }}
        />
      )}
      columns={WARRANTY_COLUMNS}
      data={data}
      getRowId={(row) => row.assetId}
      itemLabel="assets"
      {...(unavailable ? NOT_AVAILABLE : { emptyTitle: "No assets match", emptyBody: "Try clearing a filter." })}
    />
  );
}
