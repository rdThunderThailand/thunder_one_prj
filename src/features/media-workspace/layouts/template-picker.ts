// Pure logic for the Template Picker (ADR 0063 §3). The modal merges two sources that mean
// two different things — a system preset is a starting point whose geometry is *copied*, an
// operator Template is a *shared reference* — and filters the merged list in the browser.
// No query parameters reach the RPC; the only fetch is `fetchLayouts("template")`.

import type { LayoutListItem, LayoutZone } from "./types";
import { LAYOUT_TEMPLATES, type LayoutTemplate, type TemplateOrientation } from "./templates.ts";

/** What choosing a card does to the geometry — stated on the card so an operator knows,
 *  before picking, whether a later Zone edit travels to other Layouts. */
export type PickBehaviour = "copied" | "shared";

export type PickerEntry = {
  /** Preset key, or the Template's `layouts.id`. */
  id: string;
  source: "preset" | "template";
  name: string;
  orientation: TemplateOrientation;
  aspectRatio: string;
  referenceResolution: string | null;
  zones: LayoutZone[];
  zoneCount: number;
  /** Presets only; an operator Template carries no description (§3). */
  description: string | null;
  useCases: string[];
  behaviour: PickBehaviour;
  /** Templates only, for the Recently Used group. */
  lastUsedAt: string | null;
};

export type PickerFilters = {
  orientation: "all" | TemplateOrientation;
  /** "1" | "2" | "3" | "4+" */
  zoneCount: "all" | "1" | "2" | "3" | "4+";
  useCase: "all" | string;
  search: string;
};

export const DEFAULT_PICKER_FILTERS: PickerFilters = {
  orientation: "all",
  zoneCount: "all",
  useCase: "all",
  search: "",
};

function orientationOf(aspectRatio: string): TemplateOrientation {
  const [w, h] = aspectRatio.split(/[:x]/).map(Number);
  return w && h && h > w ? "portrait" : "landscape";
}

function zoneCountBucket(count: number): "1" | "2" | "3" | "4+" {
  return count >= 4 ? "4+" : (String(count) as "1" | "2" | "3");
}

export function presetEntry(template: LayoutTemplate): PickerEntry {
  return {
    id: template.key,
    source: "preset",
    name: template.name,
    orientation: template.orientation,
    aspectRatio: template.aspectRatio,
    referenceResolution: template.orientation === "portrait" ? "1080x1920" : "1920x1080",
    zones: template.zones,
    zoneCount: template.zones.length,
    description: template.description,
    useCases: template.use_cases,
    behaviour: "copied",
    lastUsedAt: null,
  };
}

export function templateEntry(layout: LayoutListItem): PickerEntry {
  return {
    id: layout.id,
    source: "template",
    name: layout.name,
    orientation: orientationOf(layout.aspect_ratio),
    aspectRatio: layout.aspect_ratio,
    referenceResolution: layout.reference_resolution ?? null,
    zones: layout.zones,
    zoneCount: layout.zone_count || layout.zones.length,
    description: null,
    useCases: [],
    behaviour: "shared",
    lastUsedAt: layout.last_used_at ?? null,
  };
}

/** Presets first, then the tenant's own active Templates (ADR 0063 §3 "All"). */
export function toPickerEntries(templates: LayoutListItem[]): PickerEntry[] {
  return [
    ...LAYOUT_TEMPLATES.map(presetEntry),
    ...templates.filter((t) => t.status === "active").map(templateEntry),
  ];
}

export function allUseCases(entries: PickerEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.useCases))].sort((a, b) => a.localeCompare(b));
}

export function filterEntries(entries: PickerEntry[], filters: PickerFilters): PickerEntry[] {
  const needle = filters.search.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filters.orientation !== "all" && entry.orientation !== filters.orientation) return false;
    if (filters.zoneCount !== "all" && zoneCountBucket(entry.zoneCount) !== filters.zoneCount) return false;
    if (filters.useCase !== "all" && !entry.useCases.includes(filters.useCase)) return false;
    if (needle) {
      const haystack = `${entry.name} ${entry.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export type PickerGroups = {
  recommended: PickerEntry[];
  myTemplates: PickerEntry[];
  all: PickerEntry[];
  recentlyUsed: PickerEntry[];
};

export function groupEntries(entries: PickerEntry[]): PickerGroups {
  return {
    recommended: entries.filter((e) => e.source === "preset"),
    myTemplates: entries.filter((e) => e.source === "template"),
    all: entries,
    recentlyUsed: entries
      .filter((e) => e.source === "template" && e.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")),
  };
}
