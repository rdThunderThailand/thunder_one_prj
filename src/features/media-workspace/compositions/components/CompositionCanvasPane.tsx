"use client";

// The canvas half of the merged editor: the Zone rectangles an operator drags, the Zone
// Overview that says which of them still needs content, Split Zone, and (ticket 26,
// ADR 0063 §5) Undo/Redo, align, and Duplicate Zone.
//
// Its own file since ticket 25. Undo/Redo's stack lives one level up, in
// CompositionEditorPage's useZoneHistory — ticket 27's Layout tab mutates the same Zone
// array from a different component and needs to land on the same stack, so every mutation
// here goes through the `onChangeStart` gate the page passes down (it checkpoints, then
// applies ADR 0052 §3's shared-Template confirm) rather than keeping a second one locally.

import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import { parseResolution, referencePixels } from "@/features/media-workspace/layouts/geometry";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { ZoneBindingDraft } from "../zone-bindings";

type ZonePreview = { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string; mediaFit?: "fit" | "fill" | "stretch" };

export function CompositionCanvasPane({
  zones,
  background,
  aspectRatio,
  referenceResolution,
  zonePreviews,
  activeZoneId,
  onSelectZone,
  onChangeStart,
  onChange,
  lockedZoneIds,
  hiddenZoneIds,
  fitSignal,
}: {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  referenceResolution: string | null;
  zonePreviews: Record<string, ZonePreview>;
  activeZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  /** Returns false to cancel the edit — the shared-Template interruption said no. On true,
   *  the caller has already taken an undo checkpoint of the Zones as they are right now. */
  onChangeStart: () => boolean;
  onChange: (zones: LayoutZone[]) => void;
  lockedZoneIds: ReadonlySet<string>;
  hiddenZoneIds: ReadonlySet<string>;
  fitSignal: number;
}) {
  const activeIndex = zones.findIndex((zone) => zone.id === activeZoneId);

  return (
      <div className="flex h-full min-h-0 flex-col">
        <LayoutCanvas
          key={fitSignal}
          zones={zones}
          background={background}
          aspectRatio={aspectRatio}
          referenceResolution={referenceResolution}
          fillAvailable
          zonePreviews={zonePreviews}
          selectedIndex={activeIndex}
          lockedZoneIds={lockedZoneIds}
          hiddenZoneIds={hiddenZoneIds}
          onSelectIndex={(index) => onSelectZone(index === null ? null : (zones[index]?.id ?? null))}
          onChangeStart={onChangeStart}
          onChange={onChange}
        />
      </div>
  );
}

const zoneBadgeClasses = ["bg-violet-600", "bg-blue-600", "bg-success"];

export function ZoneOverview({ zones, bindings, unboundZoneIds, activeZoneId, referenceResolution, onSelectZone }: {
  zones: LayoutZone[];
  bindings: ZoneBindingDraft[];
  unboundZoneIds: string[];
  activeZoneId: string | null;
  referenceResolution: string | null;
  onSelectZone: (zoneId: string | null) => void;
}) {
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">Zone Overview</p>
        {zones.map((zone, index) => {
          const isUnbound = !zone.id || unboundZoneIds.includes(zone.id);
          const binding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
          // Ticket 27: report the Zone's actual bound source — Playlist, Media, or unbound.
          // "Media" rather than "Assets" matches the frames' label for a Zone bound to
          // picked assets; a widget-rendered Zone would be "Media" too, but Widgets are
          // deferred (docs/layouts/Phase1/tickets/README.md) so that case does not exist yet.
          const sourceLabel = isUnbound ? "Unbound" : binding?.source === "assets" ? "Media" : "Playlist";
          return (
            <button
              key={zone.id ?? zone.position}
              type="button"
              onClick={() => zone.id && onSelectZone(zone.id)}
              className={`grid grid-cols-[28px_minmax(0,1fr)_auto_auto_8px] items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                zone.id === activeZoneId
                  ? "bg-primary-soft text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`grid h-7 w-7 place-items-center rounded-md font-semibold text-white ${zoneBadgeClasses[index % zoneBadgeClasses.length]}`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="truncate font-medium">{zone.name}</span>
              <span className="whitespace-nowrap text-muted-foreground">
                {resolution ? `${referencePixels(zone.width, resolution[0])} × ${referencePixels(zone.height, resolution[1])}` : `${zone.width} × ${zone.height}%`}
              </span>
              <span className="max-w-24 truncate text-muted-foreground">{sourceLabel}</span>
              <span
                aria-label={isUnbound ? "Unbound" : "Bound"}
                title={isUnbound ? "Unbound" : "Bound"}
                className={`h-2 w-2 rounded-full ${isUnbound ? "bg-warning" : "bg-success"}`}
              />
            </button>
          );
        })}
      </div>
  );
}
