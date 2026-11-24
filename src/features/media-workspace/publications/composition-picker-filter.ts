import { parseResolution } from "../layouts/geometry.ts";
import { LAYOUT_TEMPLATES, type LayoutTemplate } from "../layouts/templates.ts";
import type { CompositionLibraryItem } from "../compositions/types";

export type CompositionPickerFilters = {
  query: string;
  orientation: "all" | "landscape" | "portrait";
  aspectRatio: string;
};

export const defaultCompositionPickerFilters: CompositionPickerFilters = {
  query: "",
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

export function compositionLayoutTemplate(item: CompositionLibraryItem): LayoutTemplate | undefined {
  const orientation = compositionOrientation(item.referenceResolution);
  const zones = [...(item.previewZones ?? [])].sort((a, b) => a.position - b.position);
  return LAYOUT_TEMPLATES.find((template) =>
    template.orientation === orientation
    && template.zones.length === zones.length
    && template.zones.every((expected, index) => {
      const actual = zones[index];
      return actual
        && Math.abs(actual.x - expected.x) < 0.001
        && Math.abs(actual.y - expected.y) < 0.001
        && Math.abs(actual.width - expected.width) < 0.001
        && Math.abs(actual.height - expected.height) < 0.001;
    })
  );
}

export function compositionLayoutDisplayName(item: CompositionLibraryItem): string {
  if (!item.layout_name.startsWith("comp:")) return item.layout_name;

  return compositionLayoutTemplate(item)?.name ?? "Custom layout";
}

export function filterCompositionPickerItems(
  items: CompositionLibraryItem[],
  filters: CompositionPickerFilters
): CompositionLibraryItem[] {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.orientation !== "all" && compositionOrientation(item.referenceResolution) !== filters.orientation) return false;
    if (filters.aspectRatio !== "all" && item.referenceResolution !== filters.aspectRatio) return false;
    if (query && ![item.name, compositionLayoutDisplayName(item), ...(item.tags?.map((tag) => tag.name) ?? [])].some((value) => value?.toLowerCase().includes(query))) return false;
    return true;
  });
}
