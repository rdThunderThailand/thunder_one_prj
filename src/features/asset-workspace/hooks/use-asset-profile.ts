import { useCallback, useEffect, useEffectEvent, useState } from "react";
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
