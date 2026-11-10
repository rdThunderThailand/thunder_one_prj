import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { AssetsTableSection } from "@/features/asset-workspace/components/reports/ReportViews";
import { getAssetFilters, getAssetRows, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Assets whose own location is this one (no roll-up). The Location filter is shown locked to it.
// Register Asset opens the single wizard with `?location_id=` so a fresh draft pre-selects this location.
export default async function LocationAssetsTab({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locationId }, sp, auth] = await Promise.all([params, searchParams, reportAuth()]);
  const [rows, filters] = auth
    ? await Promise.all([
        getAssetRows(auth.token, auth.tenantId, { ...sp, location_id: locationId }),
        getAssetFilters(auth.token, auth.tenantId),
      ])
    : [null, null];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/asset-workspace/assets/register?mode=single&location_id=${encodeURIComponent(locationId)}`}>
            <PlusIcon className="h-4 w-4" />
            Register Asset
          </Link>
        </Button>
      </div>
      <AssetsTableSection
        data={rows}
        filters={filters}
        lockedLocationId={locationId}
      />
    </div>
  );
}
