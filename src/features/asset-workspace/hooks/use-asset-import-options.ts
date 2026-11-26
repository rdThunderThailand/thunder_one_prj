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
import { isFreshSeed, markSeedShown, type SectionSeed } from "../services/assets-list-seed.ts";

// Register Asset shows these settings on its bulk card, so the import page opened from it does not read them again.
let kept: SectionSeed<ImportOptions> | null = null;

export function useAssetImportOptions(
  { tenantId, userId }: AssetImportContext,
  suppliedApi?: AssetImportApi,
  seed?: SectionSeed<ImportOptions>,
) {
  const key = `${tenantId}:${userId}`;
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
    const controller = new AbortController();
    const read = async () => {
      const first = version > 0 ? undefined : [seed, kept].find((known) => isFreshSeed(known, key));
      if (seed) queueMicrotask(() => markSeedShown(seed));
      const known = first && await Promise.resolve(first.data).catch(() => null);
      if (known) return known;
      const at = Date.now();
      const options = await api.getOptions(controller.signal);
      kept = options.ready ? { key, at, data: Promise.resolve(options) } : null;
      return options;
    };
    void read()
      .then((options) => {
        if (!controller.signal.aborted) setSnapshot({ api, version, options, error: null });
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
        if (!controller.signal.aborted) setSnapshot({ api, version, options: null, error });
      });
    return () => {
      controller.abort();
    };
  }, [api, version, key, seed]);

  const current =
    snapshot?.api === api && snapshot.version === version ? snapshot : null;

  return {
    options: current?.options ?? null,
    loading: !current,
    error: current?.error ?? null,
    reload: () => setVersion((value) => value + 1),
  };
}
