import { useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { nextHistoryOp, type SequencerState } from "@/hooks/use-list-url-state";
import { CATEGORY_QUERY_KEYS, readCategoryListSearch } from "../services/category-list-query";

export function useCategoryListUrl() {
  const pathname = usePathname();
  const params = useSearchParams();
  const sequencer = useRef<SequencerState>({ mounted: true, inSearchRun: false });

  function write(search: URLSearchParams, replace = false) {
    const current = window.location.search.slice(1);
    const next = search.toString();
    if (current === next) return;
    const history = nextHistoryOp(current, next, sequencer.current);
    sequencer.current = replace ? { mounted: true, inSearchRun: false } : history.state;
    const target = next ? `${pathname}?${next}` : pathname;
    window.history[replace || history.op === "replace" ? "replaceState" : "pushState"](null, "", target);
  }

  function set(updates: Record<string, string | undefined>, replace = false) {
    const search = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    if (!("page" in updates)) search.delete("page");
    write(search, replace);
  }

  function clear() {
    const search = new URLSearchParams(window.location.search);
    for (const key of CATEGORY_QUERY_KEYS) search.delete(key);
    write(search);
  }

  const search = params.toString();
  return { search, parsed: readCategoryListSearch(search), set, clear };
}
