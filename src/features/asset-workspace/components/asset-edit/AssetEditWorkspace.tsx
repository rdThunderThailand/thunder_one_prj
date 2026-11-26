"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Match the Categories form's measured body/footer behavior without borrowing category-specific attributes. */
export function AssetEditWorkspace({ children }: { children: ReactNode }) {
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
      const fixed = blocks.filter((block) => !block.hasAttribute("data-asset-edit-body")).reduce((sum, block) => sum + block.offsetHeight, 0);
      const gap = Number.parseFloat(getComputedStyle(workspace).rowGap) || 0;
      const footer = workspace.querySelector<HTMLElement>("[data-asset-edit-footer]")?.offsetHeight ?? 0;
      const bounded = height - fixed - gap * Math.max(0, blocks.length - 1) - footer >= 192;
      const entering = bounded && workspace.dataset.bounded !== "true";
      workspace.style.setProperty("--asset-edit-height", `${Math.max(0, height)}px`);
      workspace.dataset.bounded = String(bounded);
      if (entering) { main.scrollTop = 0; if (window.scrollY) window.scrollTo({ top: 0 }); }
    }
    const observer = new ResizeObserver(fit);
    observer.observe(main);
    observer.observe(workspace);
    function observeControls() {
      if (!workspace) return;
      for (const block of workspace.children) observer.observe(block);
      for (const footer of workspace.querySelectorAll("[data-asset-edit-footer]")) observer.observe(footer);
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
    <div ref={ref} className="@container/asset-edit-workspace group/asset-edit-workspace flex min-w-0 flex-col gap-3 [&>*]:shrink-0 data-[bounded=true]:h-(--asset-edit-height) data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden">
      {children}
    </div>
  );
}
