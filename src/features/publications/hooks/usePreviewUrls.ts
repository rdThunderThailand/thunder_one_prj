"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPreviewUrls } from "../services/publications-api";

/**
 * Returns a map of media_asset_id → signed preview URL for the given ids,
 * fetching each id at most once. ponytail: signed URLs live 1h and are never
 * refreshed — fine for a wizard/detail session; revisit if a page stays open longer.
 */
export function usePreviewUrls(ids: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const requested = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = ids.filter((id) => id && !requested.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requested.current.add(id));

    let cancelled = false;
    fetchPreviewUrls(missing)
      .then((map) => {
        if (!cancelled) setUrls((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {
        // Leave these ids un-URL'd; the card falls back to its icon/label.
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return urls;
}
