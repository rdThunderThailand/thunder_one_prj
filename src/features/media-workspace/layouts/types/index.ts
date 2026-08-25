// Shapes for the Layout authoring screens (docs/adr/0044-multi-zone-layout.md). A Layout
// carries geometry and Zone roles only — there is deliberately no playlist, asset or
// duration field anywhere in here. Content is bound per Zone inside the Publication wizard.

export const ZONE_ROLES = ["main", "sidebar", "ticker", "secondary"] as const;
export type ZoneRole = (typeof ZONE_ROLES)[number];

export const LAYOUT_STATUSES = ["active", "inactive"] as const;
export type LayoutStatus = (typeof LAYOUT_STATUSES)[number];

/** Percent of the display area, 0–100, one decimal place — both axes, independently. */
export type ZoneRect = { x: number; y: number; width: number; height: number };

export type LayoutZone = ZoneRect & {
  /** Absent on a Zone the editor has not saved yet. */
  id?: string;
  /** Display order, 0-based and dense. Not a stacking order — Zones never overlap. */
  position: number;
  name: string;
  role: ZoneRole;
};

export type LayoutListItem = {
  id: string;
  name: string;
  aspect_ratio: string;
  background: string;
  status: LayoutStatus;
  zone_count: number;
  zones: LayoutZone[];
  created_at?: string;
  updated_at?: string;
  created_by?: { id: string; display_name: string } | null;
};

/** What the editor holds while working and sends on save. */
export type LayoutDraft = {
  id: string | null;
  name: string;
  aspectRatio: string;
  background: string;
  status: LayoutStatus;
  zones: LayoutZone[];
};

export const DEFAULT_ASPECT_RATIO = "16:9";
export const DEFAULT_BACKGROUND = "#000000";
