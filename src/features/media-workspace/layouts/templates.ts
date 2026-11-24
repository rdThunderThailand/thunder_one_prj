// The system starting geometries (ADR 0044 §7, catalogue fields added by ADR 0063 §3).
// Constants on purpose: ADR 0063 §3 rejected a `templates` table and catalogue columns on
// `layouts` — a preset is a *starting point* that copies its geometry into a private
// `inline` row on first save, not a shared reference, so it has no server identity to
// carry `description` / `use_cases`. Adding or editing a preset is a frontend deploy.

import type { LayoutZone } from "./types";

export type TemplateOrientation = "landscape" | "portrait";

export type LayoutTemplate = {
  key: string;
  name: string;
  /** ADR 0063 §3: the picker filters orientation from here for presets, from
   *  `aspect_ratio` for operator Templates. */
  orientation: TemplateOrientation;
  aspectRatio: string;
  /** One line, shown in the picker's details panel. Presets only (§3). */
  description: string;
  /** `Best for` chips. Free vocabulary — the picker's use-case filter is the union of
   *  every value present. */
  use_cases: string[];
  zones: LayoutZone[];
};

const zone = (
  position: number,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number
): LayoutZone => ({ position, name, x, y, width, height });

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    key: "70-30-landscape",
    name: "70 / 30",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "A dominant main area with a narrow side column for supporting content.",
    use_cases: ["Retail", "Corporate"],
    zones: [zone(0, "Main", 0, 0, 70, 100), zone(1, "Side", 70, 0, 30, 100)],
  },
  {
    key: "70-30-portrait",
    name: "70 / 30",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "A dominant top area with a short band below for supporting content.",
    use_cases: ["Retail", "Wayfinding"],
    zones: [zone(0, "Main", 0, 0, 100, 70), zone(1, "Side", 0, 70, 100, 30)],
  },
  {
    key: "50-50-landscape",
    name: "50 / 50",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "Two equal halves, side by side.",
    use_cases: ["Corporate", "Events"],
    zones: [zone(0, "Left", 0, 0, 50, 100), zone(1, "Right", 50, 0, 50, 100)],
  },
  {
    key: "50-50-portrait",
    name: "50 / 50",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "Two equal halves, stacked.",
    use_cases: ["Corporate", "Events"],
    zones: [zone(0, "Top", 0, 0, 100, 50), zone(1, "Bottom", 0, 50, 100, 50)],
  },
  {
    key: "3-zone-header-landscape",
    name: "3-Zone Header",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "A full-width header over a main area and a side column.",
    use_cases: ["News", "Corporate"],
    zones: [
      zone(0, "Header", 0, 0, 100, 15),
      zone(1, "Main", 0, 15, 70, 85),
      zone(2, "Side", 70, 15, 30, 85),
    ],
  },
  {
    key: "3-zone-header-portrait",
    name: "3-Zone Header",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "A header, a tall main area, and a footer band.",
    use_cases: ["News", "Wayfinding"],
    zones: [
      zone(0, "Header", 0, 0, 100, 12),
      zone(1, "Main", 0, 12, 100, 76),
      zone(2, "Footer", 0, 88, 100, 12),
    ],
  },
  {
    key: "left-info-panel-landscape",
    name: "Left Info Panel",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "A narrow info rail on the left beside a wide main area.",
    use_cases: ["Hospitality", "Wayfinding"],
    zones: [zone(0, "Info", 0, 0, 30, 100), zone(1, "Main", 30, 0, 70, 100)],
  },
  {
    key: "left-info-panel-portrait",
    name: "Info Panel",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "A short info band above a tall main area.",
    use_cases: ["Hospitality", "Wayfinding"],
    zones: [zone(0, "Info", 0, 0, 100, 25), zone(1, "Main", 0, 25, 100, 75)],
  },
  {
    key: "top-bottom-landscape",
    name: "Top & Bottom",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "A large main area with a ticker band across the bottom.",
    use_cases: ["News", "Retail"],
    zones: [zone(0, "Main", 0, 0, 100, 70), zone(1, "Ticker", 0, 70, 100, 30)],
  },
  {
    key: "top-bottom-portrait",
    name: "Top & Bottom",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "A tall main area with a ticker band across the bottom.",
    use_cases: ["News", "Retail"],
    zones: [zone(0, "Main", 0, 0, 100, 80), zone(1, "Ticker", 0, 80, 100, 20)],
  },
  {
    key: "4-grid-landscape",
    name: "4 Grid",
    orientation: "landscape",
    aspectRatio: "16:9",
    description: "Four equal quadrants.",
    use_cases: ["Corporate", "Events"],
    zones: [
      zone(0, "Top left", 0, 0, 50, 50),
      zone(1, "Top right", 50, 0, 50, 50),
      zone(2, "Bottom left", 0, 50, 50, 50),
      zone(3, "Bottom right", 50, 50, 50, 50),
    ],
  },
  {
    key: "4-grid-portrait",
    name: "4 Grid",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "Four equal quadrants in a portrait frame.",
    use_cases: ["Corporate", "Events"],
    zones: [
      zone(0, "Top left", 0, 0, 50, 50),
      zone(1, "Top right", 50, 0, 50, 50),
      zone(2, "Bottom left", 0, 50, 50, 50),
      zone(3, "Bottom right", 50, 50, 50, 50),
    ],
  },
  {
    key: "3-column-landscape",
    name: "3 Column",
    orientation: "landscape",
    aspectRatio: "16:9",
    // 34 / 33 / 33 rather than three equal thirds: the columns must add up to exactly 100
    // at three decimal places, and 33.333 × 3 leaves a visible sliver of background.
    description: "Three vertical columns for parallel streams of content.",
    use_cases: ["Menu board", "Corporate"],
    zones: [
      zone(0, "Left", 0, 0, 34, 100),
      zone(1, "Middle", 34, 0, 33, 100),
      zone(2, "Right", 67, 0, 33, 100),
    ],
  },
  {
    key: "3-column-portrait",
    name: "3 Row",
    orientation: "portrait",
    aspectRatio: "9:16",
    description: "Three horizontal rows for parallel streams of content.",
    use_cases: ["Menu board", "Corporate"],
    zones: [
      zone(0, "Top", 0, 0, 100, 34),
      zone(1, "Middle", 0, 34, 100, 33),
      zone(2, "Bottom", 0, 67, 100, 33),
    ],
  },
];

/** A Layout must have at least one Zone, so "start blank" seeds a full-screen main Zone
 *  rather than an empty canvas — an empty canvas is not a state the editor can save from. */
export const BLANK_ZONES: LayoutZone[] = [zone(0, "Main", 0, 0, 100, 100)];
