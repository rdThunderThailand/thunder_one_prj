"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Keep page controls outside the results scroll, following Assets' measured layout. */
export function CategoriesWorkspace({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const workspace = ref.current;
    const main = workspace?.closest("main");
    if (!workspace || !main) return;

    function fit() {
      if (!workspace || !main) return;
      const top = workspace.getBoundingClientRect().top + main.scrollTop + window.scrollY;
      const bottomPadding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const height = Math.floor((window.visualViewport?.height ?? window.innerHeight) - top - bottomPadding);
      const blocks = Array.from(workspace.children) as HTMLElement[];
      const fixed = blocks.filter((block) => !block.hasAttribute("data-category-results"))
        .reduce((sum, block) => sum + block.offsetHeight, 0);
      const gap = Number.parseFloat(getComputedStyle(workspace).rowGap) || 0;
      const controls = Array.from(workspace.querySelectorAll<HTMLElement>("[data-category-controls]"))
        .reduce((sum, block) => sum + block.offsetHeight, 0);
      // Allow page flow only when the controls leave less than three usable rows.
      const bounded = height - fixed - gap * Math.max(0, blocks.length - 1) - controls >= 160;
      const enteringBounded = bounded && workspace.dataset.bounded !== "true";
      workspace.style.setProperty("--categories-workspace-height", `${Math.max(0, height)}px`);
      workspace.dataset.bounded = String(bounded);
      if (enteringBounded) {
        main.scrollTop = 0;
        if (window.scrollY) window.scrollTo({ top: 0 });
      }
    }

    const observer = new ResizeObserver(fit);
    observer.observe(main);
    observer.observe(workspace);
    function observeControls() {
      if (!workspace) return;
      for (const block of workspace.children) observer.observe(block);
      for (const control of workspace.querySelectorAll("[data-category-controls]")) observer.observe(control);
      fit();
    }
    observeControls();
    const mutations = new MutationObserver(observeControls);
    mutations.observe(workspace, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="@container/categories group/categories-workspace flex min-w-0 flex-col gap-3 [&>*]:shrink-0 data-[bounded=true]:h-(--categories-workspace-height) data-[bounded=true]:min-h-0 data-[bounded=true]:overflow-hidden"
    >
      {children}
    </div>
  );
}
