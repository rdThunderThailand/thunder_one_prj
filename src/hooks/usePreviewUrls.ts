"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPreviewUrls, type PreviewUrls } from "@/lib/api/media-api";

const PREVIEW_CHUNK = 100;

/**
 * Returns { urls, thumbnailUrls } keyed by media_asset_id for the given ids,
 * fetching each id at most once. ponytail: signed URLs live 1h and are never
 * refreshed — fine for a wizard/detail session; revisit if a page stays open longer.
 */
export function usePreviewUrls(ids: string[]): PreviewUrls {
  const [result, setResult] = useState<PreviewUrls>({ urls: {}, thumbnailUrls: {} });
  const requested = useRef<Set<string>>(new Set());
  // Tracks unmount instead of cancelling per effect run: `ids` can change while a chunk is in
  // flight (the lazy Add Item drawer grows it as rows scroll in), and that chunk must still
  // land. Ids are marked requested up front so an in-flight id is never asked for twice; a
  // failed chunk un-marks its ids so the next `ids` change retries them.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const missing = [...new Set(ids)].filter((id) => id && !requested.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requested.current.add(id));

    // Chunked here (not only inside fetchPreviewUrls) so each batch paints as soon as it is signed.
    for (let i = 0; i < missing.length; i += PREVIEW_CHUNK) {
      const chunk = missing.slice(i, i + PREVIEW_CHUNK);
      fetchPreviewUrls(chunk)
        .then((map) => {
          if (!mounted.current) return;
          setResult((prev) => ({
            urls: { ...prev.urls, ...map.urls },
            thumbnailUrls: { ...prev.thumbnailUrls, ...map.thumbnailUrls },
          }));
        })
        .catch(() => {
          // Leave these ids un-URL'd; the card falls back to its icon/label.
          chunk.forEach((id) => requested.current.delete(id));
        });
    }
  }, [ids]);

  return result;
}
