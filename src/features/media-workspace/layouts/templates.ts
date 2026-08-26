// The seven starting compositions from ADR 0044 §7. Constants on purpose: the ADR rejected
// a `templates` table, and "Save as Template" is out of release one — user-authored
// templates raise ownership, cross-tenant sharing and edit-propagation questions for
// something nobody has asked for. An `is_template` flag on `layouts` is one migration away
// if that changes.

import type { LayoutZone } from "./types";

export type LayoutTemplate = { key: string; name: string; zones: LayoutZone[] };

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
    key: "70-30",
    name: "70 / 30",
    zones: [zone(0, "Main", 0, 0, 70, 100), zone(1, "Side", 70, 0, 30, 100)],
  },
  {
    key: "50-50",
    name: "50 / 50",
    zones: [zone(0, "Left", 0, 0, 50, 100), zone(1, "Right", 50, 0, 50, 100)],
  },
  {
    key: "3-zone-header",
    name: "3-Zone Header",
    zones: [
      zone(0, "Header", 0, 0, 100, 15),
      zone(1, "Main", 0, 15, 70, 85),
      zone(2, "Side", 70, 15, 30, 85),
    ],
  },
  {
    key: "left-info-panel",
    name: "Left Info Panel",
    zones: [zone(0, "Info", 0, 0, 30, 100), zone(1, "Main", 30, 0, 70, 100)],
  },
  {
    key: "top-bottom",
    name: "Top & Bottom",
    zones: [zone(0, "Main", 0, 0, 100, 70), zone(1, "Ticker", 0, 70, 100, 30)],
  },
  {
    key: "4-grid",
    name: "4 Grid",
    zones: [
      zone(0, "Top left", 0, 0, 50, 50),
      zone(1, "Top right", 50, 0, 50, 50),
      zone(2, "Bottom left", 0, 50, 50, 50),
      zone(3, "Bottom right", 50, 50, 50, 50),
    ],
  },
  {
    key: "3-column",
    name: "3 Column",
    // 34 / 33 / 33 rather than three equal thirds: the columns must add up to exactly 100
    // at three decimal places, and 33.333 × 3 leaves a visible sliver of background.
    zones: [
      zone(0, "Left", 0, 0, 34, 100),
      zone(1, "Middle", 34, 0, 33, 100),
      zone(2, "Right", 67, 0, 33, 100),
    ],
  },
];

/** A Layout must have at least one Zone, so "start blank" seeds a full-screen main Zone
 *  rather than an empty canvas — an empty canvas is not a state the editor can save from. */
export const BLANK_ZONES: LayoutZone[] = [zone(0, "Main", 0, 0, 100, 100)];
