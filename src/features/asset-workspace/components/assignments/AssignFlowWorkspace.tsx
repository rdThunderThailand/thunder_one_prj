"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** FE 02–04 action pages: header and steps stay put, one body scrolls (copied from AssetEditWorkspace, own names). */
export function AssignFlowWorkspace({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const workspace = ref.current;
    const main = workspace?.closest("main");
    if (!workspace || !main) return;
    function fit() {
      if (!workspace || !main) return;
      const top = workspace.getBoundingClientRect().top + main.scrollTop + window.scrollY;
      const padding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const height = Math.floor((window.visualViewport?.height ?? window.innerHeight) - top - padding);
      const blocks = Array.from(workspace.children) as HTMLElement[];
      const fixed = blocks.filter((block) => !block.hasAttribute("data-assign-body")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const gap = Number.parseFloat(getComputedStyle(workspace).rowGap) || 0;
      const footer = workspace.querySelector<HTMLElement>("[data-assign-footer]")?.offsetHeight ?? 0;
      const bounded = height - fixed - gap * Math.max(0, blocks.length - 1) - footer >= 192;
      const entering = bounded && workspace.dataset.bounded !== "true";
      workspace.style.setProperty("--assign-flow-height", `${Math.max(0, height)}px`);
      workspace.dataset.bounded = String(bounded);
      if (entering) { main.scrollTop = 0; if (window.scrollY) window.scrollTo({ top: 0 }); }
    }
    const observer = new ResizeObserver(fit);
    observer.observe(main);
    observer.observe(workspace);
    function observeControls() {
      if (!workspace) return;
      for (const block of workspace.children) observer.observe(block);
      for (const footer of workspace.querySelectorAll("[data-assign-footer]")) observer.observe(footer);
      fit();
    }
    const mutations = new MutationObserver(observeControls);
    mutations.observe(workspace, { childList: true, subtree: true });
    observeControls();
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      mutations.disconnect(); observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);
  return (
    <div ref={ref} className="@container/assign-flow group/assign-flow flex min-w-0 flex-col gap-3 [&>*]:shrink-0 data-[bounded=true]:h-(--assign-flow-height) data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden">
      {children}
    </div>
  );
}
