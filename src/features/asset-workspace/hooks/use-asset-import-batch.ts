"use client";

import { useEffect, useState } from "react";
import type { ImportBatch } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, type AssetImportApi } from "../services/asset-import-api.ts";

export function useAssetImportBatch(api: AssetImportApi, batchId: string | null) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    api: AssetImportApi;
    batchId: string;
    version: number;
    batch: ImportBatch | null;
    error: ImportApiError | null;
  } | null>(null);

  useEffect(() => {
    if (!batchId) return;
    let active = true;
    void api
      .getBatch(batchId)
      .then((batch) => {
        if (active) setSnapshot({ api, batchId, version, batch, error: null });
      })
      .catch((caught: unknown) => {
        const error =
          caught instanceof ImportApiError
            ? new ImportApiError(
                caught.code,
                requestErrorText(caught.code, caught.status),
                caught.status,
                caught.details,
              )
            : new ImportApiError("INTERNAL", requestErrorText("INTERNAL"));
        if (active) setSnapshot({ api, batchId, version, batch: null, error });
      });
    return () => {
      active = false;
    };
  }, [api, batchId, version]);

  const current =
    snapshot?.api === api && snapshot.batchId === batchId && snapshot.version === version
      ? snapshot
      : null;

  return {
    batch: current?.batch ?? null,
    loading: Boolean(batchId) && !current,
    error: current?.error ?? null,
    reload: () => setVersion((value) => value + 1),
  };
}
