"use client";

import { useEffect, useState } from "react";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { layoutPublishBlock } from "@/features/media-workspace/compositions/status-display";

/**
 * Why the Layout bound to the Edit page cannot be published, or null (also while loading or when
 * the lookup fails — Core still decides then). Fetched fresh on each mount and Layout change rather
 * than through `useContentSummary`: its page-lifetime cache would keep a Draft status after the
 * operator activates the Layout and comes back.
 */
export function useLayoutPublishBlock(compositionId: string | null): string | null {
  const [loaded, setLoaded] = useState<{ id: string; reason: string | null } | null>(null);

  useEffect(() => {
    if (!compositionId) return;
    let cancelled = false;
    fetchComposition(compositionId)
      .then((composition) => !cancelled && setLoaded({ id: compositionId, reason: layoutPublishBlock(composition.status) }))
      .catch(() => !cancelled && setLoaded({ id: compositionId, reason: null }));
    return () => {
      cancelled = true;
    };
  }, [compositionId]);

  return compositionId && loaded?.id === compositionId ? loaded.reason : null;
}
