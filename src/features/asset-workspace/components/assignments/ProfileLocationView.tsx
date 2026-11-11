"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { LocationIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/lovable/button";
import { assignmentHistoryRowNumber } from "../../domain/assignment-history";
import { locationHistoryPath } from "../../domain/assignment-location-history";
import { STATUS_TONE } from "../../domain/status-tone";
import { useProfileRead } from "../../hooks/use-asset-profile";
import {
  getAssetLocationHistory, getLocationHistoryLocations, type LocationHistoryPage, type LocationHistoryReference,
} from "../../services/asset-assignments-location-history";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { getAssetsList } from "../../services/assets-list-api";
import { AssetThumbnail } from "../AssetThumbnail";
import { DisabledHint } from "../asset-profile/ProfileControls";
import { formatDay, ProfileRows, ProfileSection, SectionMessage, StatusValue } from "../asset-profile/ProfileParts";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { AssignmentHistoryPerson } from "./AssignmentsHistoryValues";
import { ProfileAssignmentPager } from "./ProfileAssignmentPager";
import { NearbyAssetsLoading, ProfileLocationHistoryFooterLoading, ProfileLocationLoading } from "./ProfileLocationLoading";

const PAGE_SIZE = 20;
const columns = ["#", "Location", "From", "To", "By", "Notes"];
// Phase 1: Core has location types and address, but no seeded hierarchy or photos to show; frame 05 places stay, disabled.
const detailRows = ["Building", "Floor", "Area", "Room / Zone", "Address"].map((label) => ({ label, value: "—" }));
const UNSUPPORTED = "Not supported in this version.";

function LocationIntervals({ data, locations }: {
  data?: LocationHistoryPage;
  locations: ReadonlyMap<string, LocationHistoryReference>;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="relative w-full min-w-md text-left text-xs">
        <caption className="sr-only">Location history</caption>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((label) => (
              <th key={label} scope="col" className="px-2 py-2 font-semibold">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data ? data.data.map((event, index) => {
            const number = assignmentHistoryRowNumber(data.page, data.pageSize, index);
            return (
              <tr key={event.id} className="hover:bg-muted/50 [&>td]:px-2 [&>td]:py-2 [&>td]:align-top">
                <td className="tabular-nums">{number}</td>
                <td className="wrap-break-word">{locationHistoryPath(event.to, locations).join(" › ") || "—"}</td>
                <td className="whitespace-nowrap">{formatDay(event.at)}</td>
                <td className="whitespace-nowrap">{formatDay(event.until)}</td>
                <td className="min-w-24 max-w-36"><AssignmentHistoryPerson person={event.performedBy} fallback="System" /></td>
                <td className="space-y-1 whitespace-pre-wrap wrap-anywhere">
                  {number === 1 && (
                    <Badge color={STATUS_TONE.Assigned} variant="pill" className="whitespace-nowrap">Current location</Badge>
                  )}
                  <div>{event.reason || "—"}</div>
                </td>
              </tr>
            );
          }) : Array.from({ length: 4 }, (_, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} className="px-2 py-2"><Skeleton className="h-5 w-full" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NearbyAssets({ context, asset }: { context: string; asset: AssetDetail }) {
  const id = asset.location?.id;
  const nearby = useProfileRead(`${context}:${id ?? ""}:nearby-assets`,
    (signal) => getAssetsList(context, { page: 1, pageSize: 5, sort: "created_at", location_id: id }, signal), Boolean(id));
  const rows = nearby.result?.ok ? nearby.result.data.rows.filter((row) => row.id !== asset.id).slice(0, 4) : [];
  return (
    <ProfileSection title="Nearby Assets (Same Location)" action={id ? (
      <Button asChild variant="outline" size="sm">
        <Link href={`/asset-workspace/assets?${new URLSearchParams({ location_id: id })}`}>View All</Link>
      </Button>
    ) : undefined}>
      {!id ? <SectionMessage>No location assigned.</SectionMessage>
        : nearby.pending ? <NearbyAssetsLoading />
          : !nearby.result?.ok ? (
            <ErrorState title="Couldn't load nearby assets" body="Check your connection and retry." onRetry={nearby.reload} />
          ) : rows.length ? (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id} className="flex min-w-0 items-center gap-2 py-2 text-xs">
                  <AssetThumbnail src={row.thumbnail_url} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/asset-workspace/assets/${encodeURIComponent(row.id)}`} title={row.name}
                      className="block truncate rounded-control font-semibold text-foreground hover:text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                      {row.name}
                    </Link>
                    <p className="truncate text-muted-foreground">{row.asset_code}</p>
                  </div>
                  <div className="shrink-0 whitespace-nowrap"><StatusValue status={row.status} /></div>
                </li>
              ))}
            </ul>
          ) : <SectionMessage>No nearby assets.</SectionMessage>}
    </ProfileSection>
  );
}

export function ProfileLocationView({ context, asset }: { context: string; asset: AssetDetail }) {
  const [page, setPage] = useState(1);
  const paths = useProfileRead(`${context}:profile-location-paths`, (signal) => getLocationHistoryLocations(context, signal));
  const history = useProfileRead(`${context}:${asset.id}:location-intervals:${page}`,
    (signal) => getAssetLocationHistory(context, asset.id, { page, pageSize: PAGE_SIZE }, signal));
  const locations = useMemo(() => new Map(paths.result?.ok ? paths.result.data.map((location) => [location.id, location]) : []),
    [paths.result]);
  const location = asset.location;
  const reference = location && locations.get(location.id);
  const detailParents = location ? asset.locationPath.filter((item) => item.id !== location.id).flatMap((item) => item.name ? [item.name] : []) : [];
  const resolvedParents = reference ? locationHistoryPath({ ...reference, name: null }, locations) : [];
  const parents = resolvedParents.length >= detailParents.length ? resolvedParents : detailParents;
  const historyData = history.result?.ok ? history.result.data : null;
  const code = history.result && !history.result.ok ? history.result.code : undefined;

  return (
    <div className="min-w-0 space-y-3">
      <ProfileSection title="Current Location" action={(
        <DisabledHint>
          <Button variant="outline" size="sm" disabled>Edit Location</Button>
        </DisabledHint>
      )}>
        {location ? (
          <div className="space-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-control bg-accent text-accent-foreground">
                <LocationIcon aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0 wrap-anywhere">
                {parents.length > 0 && <p className="text-xs text-muted-foreground">{parents.join(" › ")}</p>}
                <p className="text-base font-semibold">{location.name ?? reference?.name ?? "Unnamed location"}</p>
              </div>
            </div>
            <div aria-disabled="true" className="space-y-1 opacity-60">
              <ProfileRows rows={detailRows} />
              <SectionMessage>Location details: {UNSUPPORTED}</SectionMessage>
            </div>
          </div>
        ) : <SectionMessage>No location assigned.</SectionMessage>}
        {paths.result && !paths.result.ok && (
          <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
            <p>Couldn&apos;t load the location path</p>
            <Button size="sm" variant="outline" disabled={paths.pending} onClick={paths.reload}>Retry</Button>
          </div>
        )}
      </ProfileSection>

      <div className="grid min-w-0 items-start gap-3 @min-5xl/asset-profile:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)_minmax(0,1fr)]">
        <ProfileSection title="Location Photos">
          <div aria-disabled="true" className="opacity-60">
            <SectionMessage>Location photos: {UNSUPPORTED}</SectionMessage>
          </div>
        </ProfileSection>
        <ProfileSection title="Location History">
          {history.pending || !history.result ? (
            <ProfileLocationLoading label="Loading location history…">
              <LocationIntervals locations={locations} />
              <ProfileLocationHistoryFooterLoading />
            </ProfileLocationLoading>
          ) : code === "NOT_FOUND" ? (
            <NotFoundState title="Asset not found" body="This asset doesn't exist in your organization, or it is no longer available." />
          ) : code === "PERMISSION_DENIED" ? (
            <AccessDeniedState title="You don't have access" body="You don't have permission to view this asset's location history." />
          ) : code === "UNAUTHENTICATED" ? (
            <EmptyState title="Sign in required" body="Your session has expired. Sign in again to view this asset." />
          ) : !historyData ? (
            <ErrorState title="Couldn't load location history" body="Check your connection and retry." onRetry={history.reload} />
          ) : historyData.data.length ? (
            <>
              <LocationIntervals data={historyData} locations={locations} />
              <ProfileAssignmentPager page={historyData.page} pageSize={historyData.pageSize} total={historyData.total}
                totalPages={historyData.totalPages} itemLabel="records" onPageChange={setPage} />
            </>
          ) : historyData.total > 0 || page > 1 ? (
            <EmptyState title="No location history on this page"
              action={<Button variant="outline" onClick={() => setPage(1)}>Go to first page</Button>} />
          ) : (
            <EmptyState title="No location history" body="Location changes will appear here." />
          )}
        </ProfileSection>
        <NearbyAssets context={context} asset={asset} />
      </div>
    </div>
  );
}
