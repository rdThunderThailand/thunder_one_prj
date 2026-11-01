import { useEffect, useEffectEvent, useState } from "react";
import { getAssetsFilters, getAssetsList, getAssetsSummary } from "../services/assets-list-api";
import { assetListQueryString, type AssetListQuery } from "../services/assets-list-query";
import type { AssetReadResult } from "../services/assets-list-types";

type Failure = Extract<AssetReadResult<never>, { ok: false }>;
interface Snapshot<T> {
  context: string; request: string; dataKey: string; data: T | null;
  error: Failure | null; denied: Failure | null;
}

function useAssetSection<T>(context: string, key: string, load: (signal: AbortSignal) => Promise<AssetReadResult<T>>) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const request = `${key}:${version}`;
  const current = snapshot?.context === context ? snapshot : null;
  const denied = current?.denied ?? null;
  const read = useEffectEvent(load);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void read(controller.signal).then((result) => {
      if (!alive) return;
      setSnapshot((previous) => {
        const retained = previous?.context === context ? previous : null;
        const access = !result.ok && [401, 403].includes(result.status) ? result : null;
        return { context, request, dataKey: result.ok ? key : retained?.dataKey ?? "",
          data: result.ok ? result.data : access ? null : retained?.data ?? null,
          error: result.ok ? null : result, denied: access };
      });
    }).catch(() => {
      if (!alive) return;
      setSnapshot((previous) => ({ context, request, dataKey: previous?.context === context ? previous.dataKey : "",
        data: previous?.context === context ? previous.data : null, denied: null,
        error: { ok: false, status: 503, message: "The asset service could not be reached. Retry this section." } }));
    });
    return () => { alive = false; controller.abort(); };
  }, [context, request, key]);

  return { data: current?.data ?? null, dataKey: current?.dataKey ?? "", denied,
    pending: current?.request !== request, error: current?.request === request ? current.error : null,
    retry: () => setVersion((value) => value + 1) };
}

export function useAssetsListData(context: string, query: AssetListQuery | null, invalidKey: string) {
  const summary = useAssetSection(context, "summary", (signal) => getAssetsSummary(context, signal));
  const filters = useAssetSection(context, "filters", (signal) => getAssetsFilters(context, signal));
  const list = useAssetSection(context, query ? assetListQueryString(query) : `invalid:${invalidKey}`, (signal) => query
    ? getAssetsList(context, query, signal)
    : Promise.resolve({ ok: false, status: 400, message: "The URL contains invalid asset filters. Clear filters and try again." }));
  return { summary, filters, list };
}

export type AssetsListResource = ReturnType<typeof useAssetsListData>["list"];
