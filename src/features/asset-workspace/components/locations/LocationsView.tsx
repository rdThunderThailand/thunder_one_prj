"use client";

// Locations list (PO 05 §4.8, FigJam 1096:1147): Map + Hierarchy + All Locations table, filters in the URL.
// Checklist: E:\ThunderOne\docs\location\asset-ws-locations-fe-checklist.md
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, ChevronRightIcon, LocationIcon } from "@/components/ui/icons";
import {
  LOCATION_STATUSES,
  LOCATION_TYPES,
  filterLocations,
  locationTone,
  mapPin,
  toTreeRows,
  type Location,
  type TreeRow,
} from "../../domain/location";
import { useListUrlState } from "../list-page/useListUrlState";
import { AssetMap } from "../overview/AssetMap";
import { ReportFilterBar } from "../reports/ReportFilterBar";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";
import { AddLocationButton } from "./LocationActions";

export const LOCATIONS_BASE = "/asset-workspace/locations";
const detailHref = (id: string) => `${LOCATIONS_BASE}/${id}`;
const assetsHref = (id: string) => `/asset-workspace/assets?location_id=${id}`;
const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

export function LocationStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="pill"
      color={locationTone(status)}
    >
      {status}
    </Badge>
  );
}

const asMapPoints = (locations: Location[]) =>
  locations.map((l) => ({ id: l.id, label: l.name, count: l.assetCount, latitude: l.latitude, longitude: l.longitude }));

export function LocationsView({ locations }: { locations: Location[] | null }) {
  const url = useListUrlState();
  const filters = { q: url.get("q"), type: url.get("type"), status: url.get("status") };
  const shown = locations ? filterLocations(locations, filters) : [];

  return (
    <div className="@container space-y-3 p-6">
      <PageHeader
        title="Locations"
        subtitle="Sites, buildings, floors and rooms where assets are kept"
        actions={locations && <AddLocationButton locations={locations} />}
      />
      {!locations ? (
        <ErrorState />
      ) : locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          body="Locations appear here once they are added."
        />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="p-4 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Map</h2>
              <AssetMap
                locations={asMapPoints(shown)}
                href={detailHref}
                includeEmpty
                className="h-72"
              />
            </Card>
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Hierarchy</h2>
              <Hierarchy rows={toTreeRows(shown)} />
            </Card>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReportFilterBar
              url={url}
              searchPlaceholder="Search name or address"
              selects={[
                { key: "type", label: "Type", options: options(LOCATION_TYPES) },
                { key: "status", label: "Status", options: options(LOCATION_STATUSES) },
              ]}
            />
          </div>
          <LocationsTable
            rows={toTreeRows(shown)}
            locations={locations}
            caption="All locations in this organization."
          />
        </>
      )}
    </div>
  );
}

/** Location Detail map: its own pin, else the nearest ancestor's (`mapPin`) with a note saying whose. */
export function LocationPointMap({ location, locations }: { location: Location; locations: Location[] }) {
  const pin = mapPin(location, locations);
  return (
    <div className="space-y-1">
      <AssetMap
        locations={asMapPoints([{ ...location, latitude: pin?.latitude ?? null, longitude: pin?.longitude ?? null }])}
        href={detailHref}
        includeEmpty
      />
      {pin?.from && <p className="text-xs text-muted-foreground">Shown at {pin.from}&apos;s location (this location has no coordinates).</p>}
    </div>
  );
}

/** Rows below a collapsed row are hidden. `rows` must be in `toTreeRows` order. */
function visibleRows(rows: TreeRow[], collapsed: Set<string>) {
  const out: TreeRow[] = [];
  let hideBelow = Infinity;
  for (const row of rows) {
    if (row.depth > hideBelow) continue;
    hideBelow = collapsed.has(row.id) ? row.depth : Infinity;
    out.push(row);
  }
  return out;
}

function Hierarchy({ rows }: { rows: TreeRow[] }) {
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const hasChildren = new Set(rows.map((r) => r.parentId));

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No locations match.</p>;

  return (
    <ul
      role="tree"
      aria-label="Location hierarchy"
      className="max-h-72 space-y-0.5 overflow-y-auto text-sm"
    >
      {visibleRows(rows, collapsed).map((row) => (
        <li
          key={row.id}
          role="treeitem"
          aria-level={row.depth + 1}
          aria-expanded={hasChildren.has(row.id) ? !collapsed.has(row.id) : undefined}
          aria-selected={false}
          className="flex items-center gap-1"
          style={{ paddingLeft: `${row.depth * 1}rem` }}
        >
          {hasChildren.has(row.id) ? (
            <button
              type="button"
              aria-label={collapsed.has(row.id) ? `Expand ${row.name}` : `Collapse ${row.name}`}
              onClick={() => toggle(row.id)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
            >
              {collapsed.has(row.id) ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <LocationIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <Link
            href={detailHref(row.id)}
            className="truncate hover:text-primary hover:underline"
          >
            {row.name}
          </Link>
          <span className="ml-auto text-xs text-muted-foreground">{row.assetCount}</span>
        </li>
      ))}
    </ul>
  );
}

/** All Locations table, also the Child Locations tab. `locations` resolves Parent names. */
export function LocationsTable({
  rows,
  locations,
  caption,
  empty = { title: "No locations match", body: "Try clearing a filter." },
}: {
  rows: TreeRow[];
  locations: Location[];
  caption: string;
  empty?: { title: string; body: string };
}) {
  const names = new Map(locations.map((l) => [l.id, l.name]));
  const cell = "border-b border-border px-3 py-2 align-middle";

  return (
    <section
      aria-label="Locations"
      className="min-w-0 overflow-x-auto rounded-card border border-border bg-card shadow-panel"
    >
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={empty.title}
            body={empty.body}
          />
        </div>
      ) : (
        <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted text-2xs text-muted-foreground [&_th]:h-10 [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:font-medium">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Parent</th>
              <th
                scope="col"
                className="text-right"
              >
                Assets
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/50"
              >
                <td className={cell}>
                  <Link
                    href={detailHref(row.id)}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                    style={{ paddingLeft: `${row.depth * 1.25}rem` }}
                  >
                    {row.name}
                  </Link>
                </td>
                <td className={cell}>{row.locationType ?? "—"}</td>
                <td className={cell}>{(row.parentId && names.get(row.parentId)) ?? "—"}</td>
                <td className={`${cell} text-right`}>
                  <Link
                    href={assetsHref(row.id)}
                    className="text-primary hover:underline"
                  >
                    {row.assetCount.toLocaleString()}
                  </Link>
                </td>
                <td className={cell}>
                  <LocationStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assets", label: "Assets" },
  { key: "children", label: "Child Locations" },
  { key: "inventory", label: "Inventory" },
  { key: "attachments", label: "Attachments" },
  { key: "history", label: "History" },
] as const;

/** Location Detail header: Overview keeps the page header (its own KPIs and map); other tabs get the hero. */
export function LocationHeaderSwitch({ overview, hero }: { overview: ReactNode; hero: ReactNode }) {
  return usePathname().endsWith("/overview") ? overview : hero;
}

export function LocationTabs({ locationId }: { locationId: string }) {
  const pathname = usePathname();
  const base = detailHref(locationId);

  return (
    <nav
      aria-label="Location"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {TABS.map((tab) => {
        const active = pathname === `${base}/${tab.key}`;
        return (
          <Link
            key={tab.key}
            href={`${base}/${tab.key}`}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
