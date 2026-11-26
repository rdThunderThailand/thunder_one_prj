"use client";

import { useState } from "react";
import { getAssetDetail } from "../../services/asset-profile-api";
import type { EditFirstData } from "../../services/asset-edit-first-data";
import { seededRead } from "../../services/seeded-read";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { useKeptReferenceTrees } from "../../hooks/use-kept-reference-trees";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, NotFoundState } from "../states/states";
import { AssetEditHeader } from "./AssetEditHeader";
import { AssetEditLoading } from "./AssetEditLoading";
import { AssetEditWorkspace } from "./AssetEditWorkspace";
import { EditAssetForm } from "./EditAssetForm";

export function EditAssetView({ context, assetId, firstData }: { context: string; assetId: string; firstData?: EditFirstData }) {
  // Refreshing the route sends new first data; an open form keeps what it started with.
  const [first] = useState(firstData);
  // Step 0: the category list starts now, together with the asset.
  const keptTrees = useKeptReferenceTrees(context, 0);
  const detail = useProfileRead(`${context}:${assetId}:edit-detail`,
    (signal) => seededRead(first?.detail, `${context}:${assetId}`, () => getAssetDetail(context, assetId, signal)));
  if (!detail.result) return <AssetEditLoading />;
  return (
    <AssetEditWorkspace>
      {detail.result.ok ? <EditAssetForm context={context} asset={detail.result.data} first={first} keptTrees={keptTrees} /> : (
        <>
          <AssetEditHeader assetId={assetId} />
          <div data-asset-edit-body className="min-h-0 overflow-y-auto p-1 group-data-[bounded=true]/asset-edit-workspace:flex-1">
            {detail.result.code === "NOT_FOUND" ? <NotFoundState title="Asset not found" body={detail.result.message} />
              : detail.result.code === "UNAUTHENTICATED" || detail.result.code === "PERMISSION_DENIED" ? <AccessDeniedState body={detail.result.message} />
                : <ErrorState title="Couldn't load this asset" body={detail.result.message} onRetry={detail.reload} />}
          </div>
        </>
      )}
    </AssetEditWorkspace>
  );
}
