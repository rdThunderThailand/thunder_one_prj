"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function AssetsListWorkspace({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const workspace = ref.current;
    const main = workspace?.closest("main");
    if (!workspace || !main) return;
    function fit() {
      if (!workspace || !main) return;
      const top = workspace.getBoundingClientRect().top + main.scrollTop + window.scrollY;
      const height = (window.visualViewport?.height ?? window.innerHeight) - top - (Number.parseFloat(getComputedStyle(main).paddingBottom) || 0);
      const blocks = Array.from(workspace.children) as HTMLElement[];
      const fixed = blocks.filter((block) => !block.hasAttribute("data-assets-table")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const gap = Number.parseFloat(getComputedStyle(workspace).rowGap) || 0;
      const controls = Array.from(workspace.querySelectorAll<HTMLElement>("[data-assets-controls]")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const bounded = workspace.clientWidth >= 960 && height - fixed - gap * Math.max(0, blocks.length - 1) - controls >= 240;
      workspace.dataset.bounded = String(bounded);
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(main);
    observer.observe(workspace);
    const observeBlocks = () => {
      for (const block of workspace.children) observer.observe(block);
      for (const control of workspace.querySelectorAll("[data-assets-controls]")) observer.observe(control);
      fit();
    };
    observeBlocks();
    const mutations = new MutationObserver(observeBlocks);
    mutations.observe(workspace, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect(); mutations.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="@container group/assets-workspace flex min-w-0 flex-col gap-3 [&>*]:shrink-0 data-[bounded=true]:h-full data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden"
    >
      {children}
    </div>
  );
}
