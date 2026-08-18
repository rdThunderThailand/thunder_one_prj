"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPreviewUrls, type PreviewUrls } from "@/lib/api/media-api";

/**
 * Returns { urls, thumbnailUrls } keyed by media_asset_id for the given ids,
 * fetching each id at most once. ponytail: signed URLs live 1h and are never
 * refreshed — fine for a wizard/detail session; revisit if a page stays open longer.
 */
export function usePreviewUrls(ids: string[]): PreviewUrls {
  const [result, setResult] = useState<PreviewUrls>({ urls: {}, thumbnailUrls: {} });
  const requested = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = ids.filter((id) => id && !requested.current.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    fetchPreviewUrls(missing)
      .then((map) => {
        if (cancelled) return;
        // Only mark as requested once the fetch actually commits — React's
        // dev-only Strict Mode double-invokes effects on initial mount, and
        // marking eagerly (before the cancelled check) would let the
        // discarded first attempt permanently block the real retry.
        missing.forEach((id) => requested.current.add(id));
        setResult((prev) => ({
          urls: { ...prev.urls, ...map.urls },
          thumbnailUrls: { ...prev.thumbnailUrls, ...map.thumbnailUrls },
        }));
      })
      .catch(() => {
        // Leave these ids un-URL'd; the card falls back to its icon/label.
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return result;
}
