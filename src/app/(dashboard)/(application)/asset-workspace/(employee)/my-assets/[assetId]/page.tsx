import { MyAssetView } from "@/features/asset-workspace/employee/my-assets/MyAssetView";
import { getMyAsset } from "@/features/asset-workspace/employee/my-assets/my-assets-api";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One asset the caller holds (EMP-02). Someone else's asset and a missing one look the same (AC-005).
export default async function MyAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ assetId }, { from }] = await Promise.all([params, searchParams]);
  // `from` is only ever a query string for this list, so Back cannot leave My Assets.
  const backHref = typeof from === "string" && from ? `/asset-workspace/my-assets?${new URLSearchParams(from)}` : "/asset-workspace/my-assets";
  const asset = UUID.test(assetId) ? await getMyAsset(assetId.toLowerCase()) : "not-found";
  if (asset === "not-found") {
    return (
      <div className="p-6">
        <NotFoundState
          title="Asset not found"
          body="This asset isn't assigned to you, or it no longer exists."
        />
      </div>
    );
  }
  if (asset === null) {
    return (
      <div className="p-6">
        <ErrorState title="Couldn't load this asset" />
      </div>
    );
  }
  return (
    <MyAssetView
      asset={asset}
      backHref={backHref}
    />
  );
}
