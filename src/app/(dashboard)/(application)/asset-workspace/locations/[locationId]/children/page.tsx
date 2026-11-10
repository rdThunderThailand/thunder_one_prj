import { AddChildLocationButton } from "@/features/asset-workspace/components/locations/LocationActions";
import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { LocationsTable } from "@/features/asset-workspace/components/locations/LocationsView";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { toTreeRows } from "@/features/asset-workspace/domain/location";
import { getLocations } from "@/features/asset-workspace/services/asset-locations-api";

// Direct children only. Add Child shows only while this location is Active (Core refuses an inactive parent).
export default async function LocationChildrenTab({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const locations = await getLocations();
  if (!locations) return <ErrorState />;
  const children = locations.filter((l) => l.parentId === locationId);
  const self = locations.find((l) => l.id === locationId);

  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="Child Locations"
        count={children.length}
        subtitle="Locations directly under this location."
        action={
          self && (
            <AddChildLocationButton
              parent={self}
              locations={locations}
            />
          )
        }
      />
      <LocationsTable
        rows={toTreeRows(children)}
        locations={locations}
        caption="Locations directly under this location."
        empty={{ title: "No child locations", body: "Locations under this one appear here." }}
      />
    </div>
  );
}
