"use client";

// What the editor is currently showing, derived from the draft: the layout itself (stored,
// edited, or not yet created), which Zone is selected, and the completeness facts the header
// and canvas read. Split out of CompositionEditorPage by ticket 25.

import { useMemo, useState } from "react";
import { DEFAULT_BACKGROUND } from "@/features/media-workspace/layouts/types";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import type { LayoutSettingsDraft } from "../save-composition";
import { findUnboundZoneIds, isComplete, type ZoneBindingDraft } from "../zone-bindings";
import { defaultBinding } from "../components/ZoneContentPicker";

export function useEditorLayout({
  layouts,
  layoutId,
  name,
  blankZones,
  editedZones,
  layoutSettings,
  bindings,
}: {
  layouts: LayoutListItem[];
  layoutId: string | null;
  name: string;
  blankZones: LayoutZone[] | null;
  editedZones: LayoutZone[] | null;
  layoutSettings: LayoutSettingsDraft | null;
  bindings: ZoneBindingDraft[];
}) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // The not-yet-created case is shaped as a full LayoutListItem rather than a partial, so
  // every reader treats "geometry that does not exist yet" like geometry that does.
  const layout = useMemo<LayoutListItem | null>(() => {
    if (!layoutId && blankZones) {
      return {
        id: "", name: name.trim() || "Blank Layout", aspect_ratio: "16:9", background: DEFAULT_BACKGROUND,
        status: "active", kind: "inline", usage_count: 0, reference_resolution: null,
        zone_count: blankZones.length, zones: blankZones,
      };
    }
    const stored = layouts.find((candidate) => candidate.id === layoutId) ?? null;
    return stored && editedZones ? { ...stored, zones: editedZones, zone_count: editedZones.length } : stored;
  }, [blankZones, editedZones, layoutId, layouts, name]);

  const layoutZoneIds = useMemo(() => layout?.zones.flatMap((zone) => (zone.id ? [zone.id] : [])) ?? [], [layout]);
  // A stale selection (the Zone was split away, or the Layout changed) falls back to the
  // first Zone rather than leaving the content picker pointed at nothing.
  const activeZoneId = selectedZoneId && layoutZoneIds.includes(selectedZoneId) ? selectedZoneId : (layoutZoneIds[0] ?? null);
  const unboundZoneIds = findUnboundZoneIds(layoutZoneIds, bindings);

  return {
    layout,
    layoutZoneIds,
    selectedZoneId: activeZoneId,
    setSelectedZoneId,
    activeZone: layout?.zones.find((zone) => zone.id === activeZoneId),
    binding: activeZoneId ? (bindings.find((b) => b.layoutZoneId === activeZoneId) ?? defaultBinding(activeZoneId)) : null,
    unboundZoneIds,
    unboundZoneNames: layout?.zones.filter((z) => z.id && unboundZoneIds.includes(z.id)).map((z) => z.name) ?? [],
    complete: isComplete(layoutZoneIds, bindings),
    sharedTemplateUsage: layout?.kind === "template" ? (layout.usage_count ?? 0) : 0,
    /** What the panel shows: the pending edit if there is one, otherwise stored geometry. */
    settings: layoutSettings ?? {
      aspectRatio: layout?.aspect_ratio ?? "16:9",
      referenceResolution: layout?.reference_resolution ?? null,
      background: layout?.background ?? DEFAULT_BACKGROUND,
    },
  };
}
