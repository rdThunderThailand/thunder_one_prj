import { LocationsView } from "@/features/asset-workspace/components/locations/LocationsView";
import { getLocations } from "@/features/asset-workspace/services/asset-locations-api";

// Filters run on the client over the full list (Core `locations` has no query params).
export default async function LocationsPage() {
  return <LocationsView locations={await getLocations()} />;
}
