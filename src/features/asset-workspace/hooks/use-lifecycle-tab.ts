import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { lifecycleListQuery } from "../domain/lifecycle-list";
import { getAssetsFilters } from "../services/assets-list-api";
import { FILTERS_KEY, SUMMARY_KEY } from "../services/assets-list-seed";
import { getLifecycleCounts, getLifecycleList, type LifecycleSeeds } from "../services/lifecycle-tab-api";
import { useAssetSection } from "./use-assets-list-data";

/** Search, filters and page live in the URL. A change reads only the rows; totals and filter options are read once per visit. */
export function useLifecycleTab(context: string, seeds: LifecycleSeeds) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const photosRefreshedFor = useRef<string | null>(null);
  const query = lifecycleListQuery(searchParams.toString());
  const counts = useAssetSection(context, SUMMARY_KEY, (signal) => getLifecycleCounts(context, signal), seeds.counts);
  const filters = useAssetSection(context, FILTERS_KEY, (signal) => getAssetsFilters(context, signal), seeds.filters);
  const list = useAssetSection(context, query, (signal) => getLifecycleList(context, query, signal), seeds.list);
  // Rows of another page or filter are never shown; a photo refresh keeps the rows on screen.
  const rows = list.dataKey === query ? list.data : null;

  function set(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in updates)) params.delete("page");
    const search = params.toString();
    const target = search ? `${pathname}?${search}` : pathname;
    if (target === `${window.location.pathname}${window.location.search}`) return;
    // Next updates useSearchParams without reading the page from the server again.
    window.history.pushState(null, "", target);
  }

  /** The photo links of a page expire together: one read brings new links for all of them. */
  function refreshPhotos() {
    if (photosRefreshedFor.current === query) return;
    photosRefreshedFor.current = query;
    list.retry();
  }

  return {
    url: { get: (key: string) => searchParams.get(key) ?? undefined, set, isPending: false },
    counts, filters, rows, refreshPhotos, retry: list.retry,
    loading: list.pending && !rows,
    signedOut: list.denied?.status === 401,
  };
}
