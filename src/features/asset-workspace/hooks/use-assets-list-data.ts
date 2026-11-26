import { useEffect, useEffectEvent, useState } from "react";
import { getAssetsFilters, getAssetsList, getAssetsSummary } from "../services/assets-list-api";
import { assetListQueryString, type AssetListQuery } from "../services/assets-list-query";
import { FILTERS_KEY, isFreshSeed, markSeedShown, SUMMARY_KEY, type AssetsListSeeds, type SectionSeed } from "../services/assets-list-seed";
import type { AssetReadResult } from "../services/assets-list-types";

type Failure = Extract<AssetReadResult<never>, { ok: false }>;
interface Snapshot<T> {
  context: string; request: string; dataKey: string; data: T | null;
  error: Failure | null; denied: Failure | null;
}

export function useAssetSection<T>(context: string, key: string, load: (signal: AbortSignal) => Promise<AssetReadResult<T>>, seed?: SectionSeed<T> | null) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const request = `${key}:${version}`;
  const current = snapshot?.context === context ? snapshot : null;
  const denied = current?.denied ?? null;
  const read = useEffectEvent(load);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const browserRead = () => alive ? read(controller.signal) : Promise.reject(new Error("The section was closed."));
    // Promise.resolve: React streams a thenable whose "then" does not chain.
    const streamed: Promise<AssetReadResult<T>> | null = isFreshSeed(seed, key)
      ? Promise.resolve(seed.data).catch(() => null).then((data) => data === null ? browserRead() : { ok: true, data }) : null;
    // Later than the development double effect, so both of its runs use the server answer.
    if (seed) queueMicrotask(() => markSeedShown(seed));
    void (streamed ?? browserRead()).then((result) => {
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
  }, [context, request, key, seed]);

  return { data: current?.data ?? null, dataKey: current?.dataKey ?? "", denied,
    pending: current?.request !== request, error: current?.request === request ? current.error : null,
    retry: () => setVersion((value) => value + 1) };
}

export function useAssetsListData(context: string, query: AssetListQuery | null, invalidKey: string, seeds?: AssetsListSeeds) {
  const summary = useAssetSection(context, SUMMARY_KEY, (signal) => getAssetsSummary(context, signal), seeds?.summary);
  const filters = useAssetSection(context, FILTERS_KEY, (signal) => getAssetsFilters(context, signal), seeds?.filters);
  const list = useAssetSection(context, query ? assetListQueryString(query) : `invalid:${invalidKey}`, (signal) => query
    ? getAssetsList(context, query, signal)
    : Promise.resolve({ ok: false, status: 400, message: "The URL contains invalid asset filters. Clear filters and try again." }), seeds?.list);
  return { summary, filters, list };
}

export type AssetsListResource = ReturnType<typeof useAssetsListData>["list"];
