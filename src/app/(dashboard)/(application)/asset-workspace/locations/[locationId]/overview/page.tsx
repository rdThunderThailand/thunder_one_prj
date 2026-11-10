import Link from "next/link";
import { BoxIcon, LocationIcon } from "@/components/ui/icons";
import { latestInventoryTile } from "@/features/asset-workspace/components/locations/LocationHero";
import { LocationPointMap, LocationStatusBadge } from "@/features/asset-workspace/components/locations/LocationsView";
import { Widget } from "@/features/asset-workspace/components/overview/OverviewPage";
import { KpiGrid, NotAvailable } from "@/features/asset-workspace/components/reports/ReportWidgets";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { EmptyState } from "@/features/asset-workspace/components/states/states";
import { StatusBadge } from "@/features/asset-workspace/components/StatusBadges";
import type { AssetStatus } from "@/features/asset-workspace/domain/asset-status";
import { getLocation, getLocations } from "@/features/asset-workspace/services/asset-locations-api";
import { getAssetRows, getSessionRows, reportAuth } from "@/features/asset-workspace/services/asset-reports-api";

const BASE = "/asset-workspace/locations";
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Overview tab (05 §4.8). Recent Activity waits on Core (L3).
export default async function LocationOverviewTab({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const auth = await reportAuth();
  const [location, locations, assets, sessions] = await Promise.all([
    getLocation(locationId),
    getLocations(),
    auth ? getAssetRows(auth.token, auth.tenantId, { location_id: locationId, pageSize: "5" }) : null,
    auth ? getSessionRows(auth.token, auth.tenantId, { location_id: locationId }) : null,
  ]);
  // The layout shows not-found / error for the location itself.
  if (!location || location === "not-found") return null;
  const children = (locations ?? []).filter((l) => l.parentId === locationId).sort((a, b) => a.name.localeCompare(b.name));
  const base = `${BASE}/${encodeURIComponent(locationId)}`;

  const latestTile = latestInventoryTile(sessions);

  const info: [string, string][] = [
    ["Type", location.locationType ?? "—"],
    ["Parent", location.parent?.name ?? "—"],
    ["Address", location.address ?? "—"],
    [
      "Coordinates",
      location.latitude !== null && location.longitude !== null ? `${location.latitude}, ${location.longitude}` : "—",
    ],
    ["Notes", location.notes ?? "—"],
    ["Updated", dateFmt.format(new Date(location.updatedAt))],
  ];

  return (
    <div className="space-y-3">
      <KpiGrid
        tiles={[
          { label: "Type", value: location.locationType ?? "—", icon: <LocationIcon className="h-4 w-4" /> },
          { label: "Total Assets", value: location.assetCount, hint: "Directly at this location", icon: <BoxIcon className="h-4 w-4" /> },
          { label: "Child Locations", value: location.childCount },
          { label: "Latest Inventory", ...latestTile },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <Widget title="Location Information">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
            {info.map(([label, value]) => (
              <div
                key={label}
                className="contents"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <LocationStatusBadge status={location.status} />
            </dd>
          </dl>
        </Widget>
        <Widget title="Map">
          <LocationPointMap
            location={location}
            locations={locations ?? []}
          />
        </Widget>
        <Widget
          title="Child Locations"
          viewAll={children.length > 6 ? `${base}/children` : undefined}
        >
          {!locations ? (
            <ErrorState />
          ) : children.length === 0 ? (
            <EmptyState
              title="No child locations"
              body="Locations under this one appear here."
            />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {children.slice(0, 6).map((child) => (
                <li
                  key={child.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <Link
                    href={`${BASE}/${encodeURIComponent(child.id)}`}
                    className="truncate hover:text-primary hover:underline"
                  >
                    {child.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{child.assetCount} assets</span>
                </li>
              ))}
            </ul>
          )}
        </Widget>
        <Widget
          title="Assets"
          viewAll={`${base}/assets`}
        >
          {!assets ? (
            <ErrorState />
          ) : assets.rows.length === 0 ? (
            <EmptyState
              title="No assets here"
              body="Assets at this location appear here."
            />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {assets.rows.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <Link
                    href={`/asset-workspace/assets/${encodeURIComponent(asset.id)}`}
                    className="min-w-0 truncate hover:text-primary hover:underline"
                  >
                    {asset.name}
                    <span className="ml-2 text-xs text-muted-foreground">{asset.asset_code}</span>
                  </Link>
                  <StatusBadge status={asset.status as AssetStatus} />
                </li>
              ))}
            </ul>
          )}
        </Widget>
      </div>
      <Widget title="Recent Activity">
        <NotAvailable />
      </Widget>
    </div>
  );
}
