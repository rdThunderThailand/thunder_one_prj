import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { getAssetActivity } from "../services/asset-profile-api";
import type { AssetActivityEntry } from "../services/asset-profile-contract";
import type { ProfileReadResult } from "../services/asset-profile-api";

const UNREACHABLE = { ok: false, code: "UNREACHABLE", status: 503, message: "The asset service could not be reached. Retry this section." } as const;

/** One Profile section's read. Loads once `enabled`; keeps the last result while a retry or refresh runs. */
export function useProfileRead<T>(key: string, load: (signal: AbortSignal) => Promise<ProfileReadResult<T>>, enabled = true) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ key: string; request: string; result: ProfileReadResult<T> } | null>(null);
  const request = `${key}:${version}`;
  const read = useEffectEvent(load);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const controller = new AbortController();
    void read(controller.signal)
      .then((result) => { if (alive) setState({ key, request, result }); })
      .catch(() => { if (alive) setState({ key, request, result: UNREACHABLE }); });
    return () => { alive = false; controller.abort(); };
  }, [key, request, enabled]);

  const current = state?.key === key ? state : null;
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { result: current?.result ?? null, pending: enabled && current?.request !== request, reload };
}

/** Asset history, newest first; "Load more" appends the next page. */
export function useAssetActivity(context: string, assetId: string, enabled: boolean) {
  const [pages, setPages] = useState(1);
  const [state, setState] = useState<{ entries: AssetActivityEntry[]; page: number; totalPages: number; total: number; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loaded = state?.page ?? 0;
  useEffect(() => {
    if (!enabled || loaded >= pages) return;
    let alive = true;
    const controller = new AbortController();
    const page = loaded + 1;
    getAssetActivity(context, assetId, page, controller.signal).then((result) => {
      if (!alive) return;
      if (!result.ok) { setError(result.message); return; }
      setError(null);
      setState((previous) => ({
        // The id keeps entries recorded at the same moment in order; drop any repeated across pages.
        entries: [...(previous?.entries ?? []), ...result.data.data.filter((entry) => !previous?.entries.some((seen) => seen.id === entry.id))],
        page, totalPages: result.data.totalPages, total: result.data.total,
        expiresAt: previous?.expiresAt ?? result.data.expiresAt,
      }));
    }).catch(() => { if (alive) setError(UNREACHABLE.message); });
    return () => { alive = false; controller.abort(); };
  }, [context, assetId, enabled, loaded, pages, attempt]);

  const refresh = useCallback(() => {
    setState(null);
    setPages(1);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);
  return {
    expiresAt: state?.expiresAt ?? null,
    refresh,
    entries: state?.entries ?? [],
    total: state?.total ?? 0,
    pending: enabled && !error && loaded < pages,
    error,
    hasMore: Boolean(state && state.page < state.totalPages),
    loadMore: () => setPages(loaded + 1),
    retry: () => { setError(null); setAttempt((value) => value + 1); },
  };
}
