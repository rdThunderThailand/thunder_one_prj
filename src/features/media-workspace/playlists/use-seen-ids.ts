"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The ids of rows that have scrolled near the viewport, in the order they were first seen.
 *  Pass `watch` as a row's `ref` and set `data-asset-id`; each row is watched until it is first
 *  seen. The Add Item drawer feeds this to `usePreviewUrls` so only rows the user can reach are
 *  signed, not the whole library. */
export function useSeenIds() {
  const [seen, setSeen] = useState<string[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  const watch = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    observer.current ??= new IntersectionObserver(
      (entries) => {
        const ids: string[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.current?.unobserve(entry.target);
          const id = (entry.target as HTMLElement).dataset.assetId;
          if (id) ids.push(id);
        }
        if (ids.length) setSeen((previous) => [...previous, ...ids]);
      },
      { rootMargin: "200px 0px" },
    );
    observer.current.observe(element);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return { seen, watch };
}
