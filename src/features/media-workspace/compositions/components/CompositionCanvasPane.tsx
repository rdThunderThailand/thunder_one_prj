"use client";

// The canvas half of the merged editor: the Zone rectangles an operator drags, the Zone
// Overview that says which of them still needs content, and Split Zone.
//
// Its own file since ticket 25 so ticket 26 (undo/redo, align/distribute, duplicate Zone)
// has somewhere to land that is not the page component.

import { Button } from "@/components/ui/Button";
import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import { splitZone } from "@/features/media-workspace/layouts/split-zone";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { ZoneBindingDraft } from "../zone-bindings";

type ZonePreview = { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string };

export function CompositionCanvasPane({
  zones,
  background,
  aspectRatio,
  zonePreviews,
  bindings,
  unboundZoneIds,
  activeZoneId,
  onSelectZone,
  onChangeStart,
  onChange,
}: {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  zonePreviews: Record<string, ZonePreview>;
  bindings: ZoneBindingDraft[];
  unboundZoneIds: string[];
  activeZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  /** Returns false to cancel the edit — the shared-Template interruption said no. */
  onChangeStart: () => boolean;
  onChange: (zones: LayoutZone[]) => void;
}) {
  const activeIndex = zones.findIndex((zone) => zone.id === activeZoneId);

  const split = () => {
    if (!onChangeStart() || activeIndex < 0) return;
    const next = splitZone(zones, activeIndex);
    if (!next) return;
    // The Zone the split created has no id yet; the canvas keys and binds by id, so it needs
    // one now rather than at save time.
    const created = activeIndex + 1;
    if (next[created] && !next[created].id) next[created] = { ...next[created], id: crypto.randomUUID() };
    onChange(next);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div className="flex flex-col gap-2">
        <LayoutCanvas
          zones={zones}
          background={background}
          aspectRatio={aspectRatio}
          zonePreviews={zonePreviews}
          selectedIndex={activeIndex}
          onSelectIndex={(index) => onSelectZone(index === null ? null : (zones[index]?.id ?? null))}
          onChangeStart={onChangeStart}
          onChange={onChange}
        />
        {activeZoneId && (
          <Button variant="secondary" onClick={split}>
            Split Zone
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Zone Overview</p>
        {zones.map((zone) => {
          const isUnbound = !zone.id || unboundZoneIds.includes(zone.id);
          const binding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
          return (
            <button
              key={zone.id ?? zone.position}
              type="button"
              onClick={() => zone.id && onSelectZone(zone.id)}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${
                zone.id === activeZoneId
                  ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span>
                <span className="block font-medium">{zone.name}</span>
                <span className="block text-[11px] text-zinc-500">
                  {zone.width}×{zone.height}% · {binding?.source === "assets" ? "Assets" : binding?.playlistName ?? "Playlist"}
                </span>
              </span>
              <span className={isUnbound ? "font-medium text-amber-700 dark:text-amber-400" : "font-medium text-emerald-700 dark:text-emerald-400"}>
                {isUnbound ? "Unbound" : "Bound"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
