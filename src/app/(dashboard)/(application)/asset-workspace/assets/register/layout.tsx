"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function RegistrationLayout({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const main = viewport?.closest("main");
    if (!viewport || !main) return;

    function fitWorkspace() {
      if (!viewport || !main) return;
      const bottomPadding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
      // Measure existing chrome without changing the shared shell. Include scroll offsets
      // so a previously scrolled parent cannot make this workspace taller than the viewport.
      const top = viewport.getBoundingClientRect().top + main.scrollTop + window.scrollY;
      const height = Math.max(0, (window.visualViewport?.height ?? window.innerHeight) - top);
      viewport.style.height = `${height}px`;
      // Occupy the main area's bottom padding without adding to its scroll height.
      viewport.style.marginBottom = `${-bottomPadding}px`;
    }

    fitWorkspace();
    const observer = new ResizeObserver(fitWorkspace);
    observer.observe(main);
    if (main.previousElementSibling) observer.observe(main.previousElementSibling);
    window.addEventListener("resize", fitWorkspace);
    window.visualViewport?.addEventListener("resize", fitWorkspace);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitWorkspace);
      window.visualViewport?.removeEventListener("resize", fitWorkspace);
    };
  }, []);

  // Before hydration: account for the 68px header and 24px top padding; absorb bottom padding locally.
  return (
    <div ref={viewportRef} className="relative -mb-6 h-[calc(100dvh-5.75rem)] min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
