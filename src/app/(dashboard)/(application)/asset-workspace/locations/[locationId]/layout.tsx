import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LocationHeaderActions } from "@/features/asset-workspace/components/locations/LocationActions";
import {
  LOCATIONS_BASE,
  LocationStatusBadge,
  LocationTabs,
} from "@/features/asset-workspace/components/locations/LocationsView";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";
import { getLocation, getLocations } from "@/features/asset-workspace/services/asset-locations-api";

// Location Detail shell (05 §4.8): header + tabs + Edit / Activate / Deactivate.
export default async function LocationDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, locations] = await Promise.all([getLocation(locationId), getLocations()]);
  const back = (
    <Link
      href={LOCATIONS_BASE}
      className="text-sm font-medium text-primary hover:underline"
    >
      Back to Locations
    </Link>
  );

  if (location === "not-found") {
    return (
      <div className="p-6">
        <NotFoundState
          title="Location not found"
          body="This location doesn't exist or is no longer available."
          action={back}
        />
      </div>
    );
  }
  if (!location) {
    return (
      <div className="p-6">
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="@container space-y-3 p-6">
      {back}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {location.name}
            <LocationStatusBadge status={location.status} />
          </span>
        }
        subtitle={[location.locationType, location.parent?.name].filter(Boolean).join(" · ") || undefined}
        actions={
          <LocationHeaderActions
            location={location}
            locations={locations ?? []}
          />
        }
      />
      <LocationTabs locationId={location.id} />
      {children}
    </div>
  );
}
