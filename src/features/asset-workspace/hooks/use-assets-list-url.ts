import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { nextHistoryOp, type SequencerState } from "@/hooks/use-list-url-state";

const filterKeys = ["page", "pageSize", "page_size", "q", "category_id", "location_id", "status", "condition", "custody_type", "custody_id", "import_batch_id", "sort", "direction"];

export function useAssetsListUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const history = useRef<SequencerState>({ mounted: true, inSearchRun: false });
  function write(params: URLSearchParams, replace = false) {
    const search = params.toString();
    const target = search ? `${pathname}?${search}` : pathname;
    if (target === `${window.location.pathname}${window.location.search}`) return;
    // Reuse Media's search-run history policy; Next updates useSearchParams without a server navigation.
    const next = nextHistoryOp(window.location.search.slice(1), search, history.current);
    history.current = replace ? { mounted: true, inSearchRun: false } : next.state;
    window.history[replace || next.op === "replace" ? "replaceState" : "pushState"](null, "", target);
  }
  function set(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(window.location.search);
    if (params.has("page_size") && !params.has("pageSize")) params.set("pageSize", params.get("page_size")!);
    params.delete("page_size");
    params.delete("direction");
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in updates)) params.delete("page");
    write(params);
  }
  function clear() {
    const params = new URLSearchParams(window.location.search);
    for (const key of filterKeys) params.delete(key);
    write(params);
  }
  function closeScan() {
    const params = new URLSearchParams(window.location.search);
    params.delete("scan");
    write(params, true);
  }
  return { search: searchParams.toString(), get: (key: string) => searchParams.get(key) ?? undefined, set, clear, closeScan, isPending: false };
}

export type AssetsListUrlState = ReturnType<typeof useAssetsListUrl>;
