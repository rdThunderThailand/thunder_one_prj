import { parseResolution } from "../layouts/geometry.ts";
import type { CompositionLibraryItem } from "../compositions/types";

export type CompositionPickerFilters = {
  query: string;
  status: "all" | "active" | "inactive";
  orientation: "all" | "landscape" | "portrait";
  aspectRatio: string;
};

export const defaultCompositionPickerFilters: CompositionPickerFilters = {
  query: "",
  status: "all",
  orientation: "all",
  aspectRatio: "all",
};

export function compositionOrientation(
  referenceResolution: string | null | undefined
): "landscape" | "portrait" | null {
  const parsed = referenceResolution ? parseResolution(referenceResolution) : null;
  if (!parsed) return null;
  return parsed[1] > parsed[0] ? "portrait" : "landscape";
}

/** Publication can only reference a usable Composition, so drafts never enter this list —
 *  the shared list endpoint returns them, we drop them here (mirrors the Playlist picker). */
export function publishableCompositions(items: CompositionLibraryItem[]): CompositionLibraryItem[] {
  return items.filter((item) => item.status !== "draft");
}

export function filterCompositionPickerItems(
  items: CompositionLibraryItem[],
  filters: CompositionPickerFilters
): CompositionLibraryItem[] {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.orientation !== "all" && compositionOrientation(item.referenceResolution) !== filters.orientation) return false;
    if (filters.aspectRatio !== "all" && item.referenceResolution !== filters.aspectRatio) return false;
    if (query && ![item.name, item.layout_name, ...(item.tags?.map((tag) => tag.name) ?? [])].some((value) => value?.toLowerCase().includes(query))) return false;
    return true;
  });
}
