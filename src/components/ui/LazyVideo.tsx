"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A <video> thumbnail that only fetches once it is near the viewport.
 *
 * Assets carry no poster image server-side, so painting a first frame means
 * downloading real video data — the library averages 11MB per file. Mounting
 * every card's source at once made the picker grid pull the whole library
 * before the first tile appeared.
 */
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      // Start fetching just before the tile scrolls in, so the frame is usually
      // painted by the time it is actually on screen.
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  // #t=0.1 makes the browser paint the first frame as a poster.
  return (
    <video
      ref={ref}
      src={visible ? `${src}#t=0.1` : undefined}
      muted
      preload="metadata"
      className={className}
    />
  );
}
