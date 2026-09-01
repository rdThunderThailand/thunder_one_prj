// Shapes for the Composition authoring screens (docs/adr/0049-composition-layout-with-content.md).
// A Composition pairs one Layout with content for each of its Zones — geometry lives on the
// Layout (src/features/media-workspace/layouts), content lives here.

export const COMPOSITION_STATUSES = ["draft", "active", "inactive"] as const;
export type CompositionStatus = (typeof COMPOSITION_STATUSES)[number];

export type CompositionListItem = {
  id: string;
  name: string;
  layout_id: string;
  layout_name: string;
  status: CompositionStatus;
  revision: number;
  zone_count: number;
  bound_count: number;
  created_at?: string;
  updated_at?: string;
};

export type CompositionGeometryKind = "template" | "inline";

export type CompositionLibraryPreviewZone = {
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  firstAssetId: string | null;
};

export type CompositionLibraryItem = CompositionListItem & {
  layoutKind?: CompositionGeometryKind;
  referenceResolution?: string | null;
  folderId?: string | null;
  deletedAt?: string | null;
  usageCount?: number;
  previewZones?: CompositionLibraryPreviewZone[];
};

export type CompositionLibraryPage = {
  data: CompositionLibraryItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number } | null;
  summary: { total: number; templateBased: number; custom: number; needsContent: number } | null;
  facets: { referenceResolutions: string[] };
  isLegacyResponse: boolean;
};

export type CompositionZonePlayback = {
  play_mode: "sequential" | "shuffle";
  repeat: "loop" | "once";
  start_from: "first" | "resume";
};

/** One row per Zone of the Composition's Layout, LEFT JOINed — an unbound Zone still
 *  appears here with `playlist_id: null` (ADR 0049 §1). */
export type CompositionZone = {
  layout_zone_id: string;
  position: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  playlist_id: string | null;
  playback: CompositionZonePlayback | null;
};

export type CompositionDetail = {
  id: string;
  name: string;
  layout_id: string;
  status: CompositionStatus;
  revision: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  zones: CompositionZone[];
};

/** Picked-asset item for a Zone's implicit inline Playlist — same shape Publication's
 *  wizard already uses (ADR 0049 §3), kept local so this feature has no Publication import. */
export type CompositionAssetItem = {
  media_asset_id: string;
  duration_seconds: number | null;
  transition?: "cut" | "fade";
};
