"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Read the bound Layout directly so returning from the Layout editor can refresh its status. */
export function useLayoutPublishBlock(compositionId: string | null, wizardStep?: number): LayoutPublishGate {
  const [loaded, setLoaded] = useState<{ id: string; status: CompositionStatus; allBound: boolean } | null>(null);
  const latestRequest = useRef<{ id: string } | null>(null);
  const refreshStep = wizardStep === 2 || wizardStep === 5 ? wizardStep : 0;
  const isWizard = wizardStep !== undefined;

  useEffect(() => {
    if (!compositionId) return;
    const refresh = () => {
      const request = { id: compositionId };
      latestRequest.current = request;
      void fetchComposition(compositionId)
        .then((composition) => {
          if (latestRequest.current !== request) return;
          setLoaded({ id: compositionId, status: composition.status, allBound: composition.zones.every((zone) => !!zone.playlist_id) });
        })
        .catch(() => {
          // Keep the last known status if the refresh fails. Core still checks on publish.
        });
    };

    if (!isWizard || refreshStep) refresh();
    if (isWizard) window.addEventListener("focus", refresh);
    return () => {
      latestRequest.current = null;
      if (isWizard) window.removeEventListener("focus", refresh);
    };
  }, [compositionId, isWizard, refreshStep]);

  const setStatus = useCallback(
    (status: CompositionStatus) => {
      if (latestRequest.current?.id === compositionId) latestRequest.current = null;
      setLoaded((current) => (current && current.id === compositionId ? { ...current, status } : current));
    },
    [compositionId],
  );

  const current = compositionId && loaded?.id === compositionId ? loaded : null;
  return {
    reason: current?.status ? layoutPublishBlock(current.status) : null,
    canActivate: current?.allBound ?? false,
    setStatus,
  };
}
