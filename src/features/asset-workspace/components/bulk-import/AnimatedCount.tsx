"use client";

import { useEffect, useRef, useState } from "react";
import { formatCount } from "../../domain/asset-import-format";

const DURATION_MS = 500;

/** Rolls to a value Core already reported; it never shows a number ahead of that value. */
export function AnimatedCount({ value, from }: { value: number; from?: number }) {
  const [shown, setShown] = useState(from ?? value);
  const latest = useRef(from ?? value);

  useEffect(() => {
    const start = latest.current;
    if (start === value) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min((now - began) / DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      latest.current = Math.round(start + (value - start) * eased);
      setShown(latest.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      <span aria-hidden="true">{formatCount(shown)}</span>
      <span className="sr-only">{formatCount(value)}</span>
    </>
  );
}
