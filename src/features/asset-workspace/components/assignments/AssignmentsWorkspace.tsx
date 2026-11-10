"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { listViewportMetrics } from "./assignment-viewport-metrics";

/** Assignment controls and pager stay outside the measured results scroll. */
export function AssignmentsWorkspace({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    const main = root?.closest("main");
    if (!root || !main) return;
    const observed = new Set<Element>();
    const resize = new ResizeObserver(measure);
    function measure() {
      if (!root || !main) return;
      const results = root.querySelector<HTMLElement>("[data-list-results]");
      if (!results) return;
      const blocks = Array.from(root.children).filter((node) => (node as HTMLElement).offsetHeight > 0) as HTMLElement[];
      const footer = results.querySelector<HTMLElement>("[data-list-controls]");
      const heading = results.querySelector<HTMLElement>("thead");
      const row = results.querySelector<HTMLElement>("tbody tr");
      const style = getComputedStyle(results);
      const number = (value: string) => Number.parseFloat(value) || 0;
      const metrics = listViewportMetrics({
        viewportBottom: window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight,
        top: root.getBoundingClientRect().top + main.scrollTop + window.scrollY,
        bottomPadding: number(getComputedStyle(main).paddingBottom),
        fixedHeight: blocks.filter((block) => block !== results).reduce((sum, block) => sum + block.offsetHeight, 0),
        gaps: number(getComputedStyle(root).rowGap) * Math.max(0, blocks.length - 1),
        cardChrome: number(style.paddingTop) + number(style.paddingBottom) + number(style.borderTopWidth) + number(style.borderBottomWidth),
        footer: footer?.offsetHeight ?? 0, heading: heading?.offsetHeight ?? 32,
        row: row?.offsetHeight ?? 64,
      });
      const entering = metrics.bounded && root.dataset.bounded !== "true";
      root.style.setProperty("--list-viewport-height", `${metrics.height}px`);
      root.dataset.bounded = String(metrics.bounded);
      if (entering) {
        main.scrollTop = 0;
        if (window.scrollY) window.scrollTo({ top: 0 });
      }
      for (const element of [main, root, ...blocks, footer, heading, row]) {
        if (element && !observed.has(element)) { observed.add(element); resize.observe(element); }
      }
      for (const element of observed) {
        if (!element.isConnected) { resize.unobserve(element); observed.delete(element); }
      }
    }
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(root, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      resize.disconnect(); mutations.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      root.style.removeProperty("--list-viewport-height");
      delete root.dataset.bounded;
    };
  }, []);
  return (
    <div
      ref={ref}
      className="@container/assignments group/list-viewport flex min-w-0 flex-col gap-3 [&>:not([data-list-results])]:flex-none data-[bounded=true]:h-(--list-viewport-height) data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden"
    >
      {children}
    </div>
  );
}
