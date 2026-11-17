"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { layoutPublishBlock } from "@/features/media-workspace/compositions/status-display";
import type { CompositionStatus } from "@/features/media-workspace/compositions/types";

export type LayoutPublishGate = {
  /** Why the Layout cannot be published, or null (also while loading or when the lookup fails — Core still decides). */
  reason: string | null;
  /** Every Zone is bound — the only thing Core checks when a Layout is activated, so Activate can be offered in place. */
  canActivate: boolean;
  /** Takes the status Core returned after Activate, so the gate clears without a reload. */
  setStatus: (status: CompositionStatus) => void;
};

/**
 * The gate for the Layout bound to a Program (ADR 0114). Fetched fresh on each mount and Layout
 * change rather than through `useContentSummary`: its page-lifetime cache would keep a Draft status
 * after the operator activates the Layout and comes back.
 */
export function useLayoutPublishBlock(compositionId: string | null): LayoutPublishGate {
  const [loaded, setLoaded] = useState<{ id: string; status: CompositionStatus | null; allBound: boolean } | null>(null);

  useEffect(() => {
    if (!compositionId) return;
    let cancelled = false;
    fetchComposition(compositionId)
      .then(
        (composition) =>
          !cancelled &&
          setLoaded({ id: compositionId, status: composition.status, allBound: composition.zones.every((zone) => !!zone.playlist_id) }),
      )
      .catch(() => !cancelled && setLoaded({ id: compositionId, status: null, allBound: false }));
    return () => {
      cancelled = true;
    };
  }, [compositionId]);

  const setStatus = useCallback(
    (status: CompositionStatus) => setLoaded((current) => (current ? { ...current, status } : current)),
    [],
  );

  const current = compositionId && loaded?.id === compositionId ? loaded : null;
  return {
    reason: current?.status ? layoutPublishBlock(current.status) : null,
    canActivate: current?.allBound ?? false,
    setStatus,
  };
}
