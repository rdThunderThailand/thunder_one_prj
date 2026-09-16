"use client";

import { useEffect, useState } from "react";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";

/** The Layout's declared aspect ratio, for the advisory geometry fit warning (ADR 0055).
 *  Composition reads carry `layout_id` but not the ratio, so it takes two hops.
 *  Keyed by composition id, exactly as usePlaylistPreview is keyed by playlist id, so a stale
 *  response for a previously-selected Composition never renders. `failed` is distinct from
 *  "no Composition": the caller must say it could not check, not quietly show nothing. */
export function useLayoutAspectRatio(compositionId: string | null): {
  aspectRatio: string | null;
  failed: boolean;
} {
  const [result, setResult] = useState<
    { id: string; aspectRatio: string } | { id: string; failed: true } | null
  >(null);

  useEffect(() => {
    if (!compositionId) return;
    let alive = true;
    fetchComposition(compositionId)
      .then((composition) => fetchLayout(composition.layout_id))
      .then((layout) => alive && setResult({ id: compositionId, aspectRatio: layout.aspect_ratio }))
      .catch(() => alive && setResult({ id: compositionId, failed: true }));
    return () => {
      alive = false;
    };
  }, [compositionId]);

  const current = result?.id === compositionId ? result : null;
  return {
    aspectRatio: current && "aspectRatio" in current ? current.aspectRatio : null,
    failed: current ? "failed" in current : false,
  };
}
