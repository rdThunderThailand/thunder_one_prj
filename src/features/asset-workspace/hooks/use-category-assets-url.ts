import { useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { nextHistoryOp, type SequencerState } from "@/hooks/use-list-url-state";
import { categoryDetailTab, clearCategoryAssetsSearch, readCategoryAssetsSearch, updateCategoryAssetsSearch } from "../services/category-assets-query";

export function useCategoryAssetsUrl(categoryId: string) {
  const pathname = usePathname();
  const params = useSearchParams();
  const sequencer = useRef<SequencerState>({ mounted: true, inSearchRun: false });
  function write(params: URLSearchParams, replace = false) {
    const current = window.location.search.slice(1);
    const next = params.toString();
    if (next === current) return;
    const history = nextHistoryOp(current, next, sequencer.current);
    sequencer.current = replace ? { mounted: true, inSearchRun: false } : history.state;
    window.history[replace || history.op === "replace" ? "replaceState" : "pushState"](null, "", next ? `${pathname}?${next}` : pathname);
  }
  const search = params.toString();
  return { search, tab: categoryDetailTab(search), parsed: readCategoryAssetsSearch(categoryId, search),
    set: (updates: Record<string, string | undefined>, replace = false) => write(updateCategoryAssetsSearch(window.location.search, updates), replace),
    clear: () => write(clearCategoryAssetsSearch(window.location.search)),
    setTab: (tab: string) => write(updateCategoryAssetsSearch(window.location.search, { tab: tab === "assets" ? "assets" : undefined })),
  };
}
