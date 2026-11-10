import { useEffect } from "react";

/** Follow Asset Workspace's capture-phase link and native unload guards; never change shell navigation. */
export function useAssetEditLeave(dirty: boolean, sending: boolean, uncertain: boolean, saved: boolean) {
  const guarded = !saved && (dirty || sending || uncertain);
  useEffect(() => {
    if (!guarded) return;
    const message = sending ? "A save is in progress. Leave this page?" : uncertain
      ? "The save outcome is unknown. Check the latest profile before saving again. Leave this page?"
      : "Discard your unsaved changes and leave this page?";
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    // Guard history traversals only where the browser exposes a cancelable Navigation API event.
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const traverse = (event: Event) => {
      if ((event as Event & { navigationType?: string }).navigationType === "traverse" && event.cancelable && !window.confirm(message)) event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      navigation?.removeEventListener("navigate", traverse);
    };
  }, [guarded, sending, uncertain]);
}
