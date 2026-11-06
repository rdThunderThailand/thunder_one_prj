"use client";

import { useEffect, useMemo, useState } from "react";
import type { ImportOptions } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import {
  getAssetImportApi,
  ImportApiError,
  type AssetImportApi,
  type AssetImportContext,
} from "../services/asset-import-api.ts";

export function useAssetImportOptions(
  { tenantId, userId }: AssetImportContext,
  suppliedApi?: AssetImportApi,
) {
  const api = useMemo(
    () => suppliedApi ?? getAssetImportApi({ tenantId, userId }),
    [suppliedApi, tenantId, userId],
  );
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    api: AssetImportApi;
    version: number;
    options: ImportOptions | null;
    error: ImportApiError | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void api
      .getOptions()
      .then((options) => {
        if (active) setSnapshot({ api, version, options, error: null });
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
        if (active) setSnapshot({ api, version, options: null, error });
      });
    return () => {
      active = false;
    };
  }, [api, version]);

  const current =
    snapshot?.api === api && snapshot.version === version ? snapshot : null;

  return {
    options: current?.options ?? null,
    loading: !current,
    error: current?.error ?? null,
    reload: () => setVersion((value) => value + 1),
  };
}
