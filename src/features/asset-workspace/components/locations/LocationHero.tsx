import Link from "next/link";
import type { ReactNode } from "react";
import { BoxIcon, BuildingIcon, InventoryIcon, LayersIcon, LocationIcon } from "@/components/ui/icons";
import type { Location, LocationDetail } from "../../domain/location";
import type { SessionRow } from "../../services/asset-reports-api";
import type { ListData } from "../list-page/AssetWorkspaceListPage";
import { LocationPointMap, LocationStatusBadge } from "./LocationsView";

// Not LocationsView's LOCATIONS_BASE: a "use client" export is a client reference on the server, not a string.
const LOCATIONS_BASE = "/asset-workspace/locations";
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export interface LatestInventory {
  value: string | null;
  hint: string;
}

/** Latest Inventory = newest session that has started (the list is newest first; Drafts have no start).
 *  `sessions` is `getSessionRows(…, { location_id })`, or null when signed out. */
// ponytail: looks at the first page only (20 sessions); add a `started` filter to the route if drafts pile up.
export function latestInventoryTile(
  sessions: { data: ListData<SessionRow> | null; unavailable: boolean } | null,
): LatestInventory {
  if (!sessions?.data) return { value: null, hint: "Couldn't load" };
  if (sessions.unavailable) return { value: null, hint: "Not available yet" };
  const latest = sessions.data.rows.find((s) => s.startedAt);
  return latest
    ? { value: dateFmt.format(new Date(latest.startedAt!)), hint: `${latest.status} · ${latest.progressPct}%` }
    : { value: "—", hint: "No inventory yet" };
}

/** Location Detail header on every tab except Overview (Figma hero). Owner / Manager wait on a BE field. */
export function LocationHero({ location, locations, latest, actions }: {
  location: LocationDetail; locations: Location[]; latest: LatestInventory; actions: ReactNode;
}) {
  const base = `${LOCATIONS_BASE}/${encodeURIComponent(location.id)}`;
  const link = "hover:text-primary hover:underline";

  return (
    <section
      aria-label="Location summary"
      className="grid gap-4 rounded-card border border-border bg-card p-4 shadow-panel lg:grid-cols-[1fr_18rem]"
    >
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="inline-flex flex-wrap items-center gap-2 text-2xl font-semibold text-foreground">
            {location.name}
            <LocationStatusBadge status={location.status} />
          </h1>
          {actions}
        </div>
        {(location.locationType || location.address) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {location.locationType && (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <BuildingIcon className="h-4 w-4" />
                {location.locationType}
              </span>
            )}
            {location.address && (
              <span className="inline-flex items-center gap-1.5">
                <LocationIcon className="h-4 w-4" />
                {location.address}
              </span>
            )}
          </div>
        )}
        {location.notes && <p className="text-sm text-muted-foreground">{location.notes}</p>}
        <dl className="grid grid-cols-2 gap-3 pt-1 xl:grid-cols-4 xl:divide-x xl:divide-border">
          <Stat
            icon={<BuildingIcon className="h-4 w-4" />}
            label="Parent Location"
            value={
              location.parent ? (
                <Link
                  href={`${LOCATIONS_BASE}/${encodeURIComponent(location.parent.id)}`}
                  className={link}
                >
                  {location.parent.name}
                </Link>
              ) : (
                "—"
              )
            }
            hint={location.parent ? "Parent of this location" : "No parent location"}
          />
          <Stat
            icon={<LayersIcon className="h-4 w-4" />}
            label="Child Locations"
            value={location.childCount.toLocaleString()}
            hint={
              <Link
                href={`${base}/children`}
                className={link}
              >
                View child locations
              </Link>
            }
          />
          <Stat
            icon={<BoxIcon className="h-4 w-4" />}
            label="Total Assets"
            value={location.assetCount.toLocaleString()}
            hint={
              <Link
                href={`${base}/assets`}
                className={link}
              >
                Assets at this location
              </Link>
            }
          />
          <Stat
            icon={<InventoryIcon className="h-4 w-4" />}
            label="Last Inventory"
            value={latest.value ?? "—"}
            hint={latest.hint}
          />
        </dl>
      </div>
      <LocationPointMap
        location={location}
        locations={locations}
      />
    </section>
  );
}

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3 xl:px-3 xl:first:pl-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-lg font-semibold text-foreground">{value}</dd>
        <dd className="truncate text-xs text-muted-foreground">{hint}</dd>
      </div>
    </div>
  );
}

/** Section header on top of each Location Detail tab (Figma): "Assets (520)" + one line + the tab's main action.
 *  h2: the hero holds the page's h1. `count` is omitted where the tab has no total yet. */
export function LocationTabHeader({ title, count, subtitle, action }: {
  title: string; count?: number | null; subtitle: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          {title}
          {typeof count === "number" && ` (${count.toLocaleString()})`}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
