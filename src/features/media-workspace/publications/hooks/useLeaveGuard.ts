import { useEffect } from "react";

/**
 * Guards unsaved edits. `beforeunload` covers reload / tab close; in-app anchors (sidebar, breadcrumb) are
 * caught in the capture phase, before Next's Link handler runs, and handed to `onLeave` to confirm.
 */
export function useLeaveGuard(isDirty: boolean, onLeave: (href: string) => void) {
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const intercept = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      const next = url.pathname + url.search;
      if (next === window.location.pathname + window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      onLeave(next);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", intercept, true);
    };
  }, [isDirty, onLeave]);
}
