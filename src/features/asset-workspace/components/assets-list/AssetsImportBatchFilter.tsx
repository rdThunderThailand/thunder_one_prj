"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/lovable/button";
import { useAssetImportBatch } from "../../hooks/use-asset-import-batch";
import { getAssetImportApi } from "../../services/asset-import-api";

/** Keep the list usable if import reads are closed or this viewer cannot read batch details. */
export function AssetsImportBatchFilter({ context, batchId }: { context: string; batchId: string }) {
  const [tenantId = "", userId = ""] = context.split(":");
  const api = useMemo(() => getAssetImportApi({ tenantId, userId }), [tenantId, userId]);
  const { batch, loading, error, reload } = useAssetImportBatch(api, batchId);
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
      <span className="wrap-anywhere" title={batchId}>
        {batch ? `Import ID: ${batch.batchCode}` : `Import batch: ${batchId}`}
      </span>
      {loading && <span role="status">Loading import details…</span>}
      {error && ![401, 403, 404].includes(error.status) && (
        <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={reload}>
          Retry import details
        </Button>
      )}
    </span>
  );
}
