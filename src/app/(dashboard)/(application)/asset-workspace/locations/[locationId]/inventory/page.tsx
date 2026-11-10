import { InventoryIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { LocationInventorySection } from "@/features/asset-workspace/components/reports/ReportViews";
import { getSessionRows, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Inventory sessions whose scope includes this location (05 §4.9). Start Inventory waits on the Inventory module.
export default async function LocationInventoryTab({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locationId }, sp, auth] = await Promise.all([params, searchParams, reportAuth()]);
  const sessions = auth
    ? await getSessionRows(auth.token, auth.tenantId, { ...sp, location_id: locationId })
    : { data: null, unavailable: false };

  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="Inventory Sessions"
        count={sessions.unavailable ? null : sessions.data?.total}
        subtitle="Stocktake and verification sessions that cover this location."
        action={
          <Button
            disabled
            title="Available when the Inventory module is ready"
          >
            <InventoryIcon className="h-4 w-4" />
            Start Inventory
          </Button>
        }
      />
      <LocationInventorySection
        data={sessions.data}
        unavailable={sessions.unavailable}
      />
    </div>
  );
}
