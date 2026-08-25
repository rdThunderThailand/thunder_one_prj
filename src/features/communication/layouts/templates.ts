// The seven starting compositions from ADR 0044 §7. Constants on purpose: the ADR rejected
// a `templates` table, and "Save as Template" is out of release one — user-authored
// templates raise ownership, cross-tenant sharing and edit-propagation questions for
// something nobody has asked for. An `is_template` flag on `layouts` is one migration away
// if that changes.

import type { LayoutZone, ZoneRole } from "./types";

export type LayoutTemplate = { key: string; name: string; zones: LayoutZone[] };

const zone = (
  position: number,
  name: string,
  role: ZoneRole,
  x: number,
  y: number,
  width: number,
  height: number
): LayoutZone => ({ position, name, role, x, y, width, height });

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    key: "70-30",
    name: "70 / 30",
    zones: [zone(0, "Main", "main", 0, 0, 70, 100), zone(1, "Side", "sidebar", 70, 0, 30, 100)],
  },
  {
    key: "50-50",
    name: "50 / 50",
    zones: [zone(0, "Left", "main", 0, 0, 50, 100), zone(1, "Right", "secondary", 50, 0, 50, 100)],
  },
  {
    key: "3-zone-header",
    name: "3-Zone Header",
    zones: [
      zone(0, "Header", "ticker", 0, 0, 100, 15),
      zone(1, "Main", "main", 0, 15, 70, 85),
      zone(2, "Side", "sidebar", 70, 15, 30, 85),
    ],
  },
  {
    key: "left-info-panel",
    name: "Left Info Panel",
    zones: [zone(0, "Info", "sidebar", 0, 0, 30, 100), zone(1, "Main", "main", 30, 0, 70, 100)],
  },
  {
    key: "top-bottom",
    name: "Top & Bottom",
    zones: [zone(0, "Main", "main", 0, 0, 100, 70), zone(1, "Ticker", "ticker", 0, 70, 100, 30)],
  },
  {
    key: "4-grid",
    name: "4 Grid",
    zones: [
      zone(0, "Top left", "main", 0, 0, 50, 50),
      zone(1, "Top right", "secondary", 50, 0, 50, 50),
      zone(2, "Bottom left", "secondary", 0, 50, 50, 50),
      zone(3, "Bottom right", "secondary", 50, 50, 50, 50),
    ],
  },
  {
    key: "3-column",
    name: "3 Column",
    // 34 / 33 / 33 rather than three equal thirds: the columns must add up to exactly 100
    // at one decimal place, and 33.3 × 3 leaves a visible sliver of background.
    zones: [
      zone(0, "Left", "main", 0, 0, 34, 100),
      zone(1, "Middle", "secondary", 34, 0, 33, 100),
      zone(2, "Right", "secondary", 67, 0, 33, 100),
    ],
  },
];

/** A Layout must have at least one Zone, so "start blank" seeds a full-screen main Zone
 *  rather than an empty canvas — an empty canvas is not a state the editor can save from. */
export const BLANK_ZONES: LayoutZone[] = [zone(0, "Main", "main", 0, 0, 100, 100)];
