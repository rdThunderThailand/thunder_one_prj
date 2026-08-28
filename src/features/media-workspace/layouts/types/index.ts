// Shapes for the Layout authoring screens (docs/adr/0044-multi-zone-layout.md). A Layout
// carries geometry only — there is deliberately no playlist, asset or duration field
// anywhere in here. Content is bound to a Composition (docs/adr/0049), one per Zone.

export const LAYOUT_STATUSES = ["active", "inactive"] as const;
export type LayoutStatus = (typeof LAYOUT_STATUSES)[number];
export const LAYOUT_KINDS = ["inline", "template"] as const;
export type LayoutKind = (typeof LAYOUT_KINDS)[number];

/** Percent of the display area, 0–100, three decimal places — both axes, independently. */
export type ZoneRect = { x: number; y: number; width: number; height: number };

export type LayoutZone = ZoneRect & {
  /** Absent on a Zone the editor has not saved yet. Stable once assigned — a rename or
   *  resize keeps the id, which is what lets a Composition bind to it durably. */
  id?: string;
  /** Display order, 0-based and dense. Not a stacking order — Zones never overlap. */
  position: number;
  name: string;
};

export type LayoutListItem = {
  id: string;
  name: string;
  aspect_ratio: string;
  background: string;
  status: LayoutStatus;
  /** Absent only while the deployed Core has not yet applied Ticket 14's migration. */
  kind?: LayoutKind;
  usage_count?: number;
  reference_resolution?: string | null;
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
