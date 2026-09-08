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

import { ALIGN_EDGES, alignZone, duplicateZone, type AlignEdge } from "@/features/media-workspace/layouts/align-zones";
import { Button } from "@/components/ui/Button";
import { ClipboardIcon, LayoutIcon, RedoIcon, UndoIcon } from "@/components/ui/icons";
import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import { splitZone } from "@/features/media-workspace/layouts/split-zone";
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
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
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
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

  const align = (edge: (typeof ALIGN_EDGES)[number]["edge"]) => {
    if (!onChangeStart() || activeIndex < 0) return;
    onChange(zones.map((zone, index) => (index === activeIndex ? alignZone(zone, edge) : zone)));
  };

  const duplicate = () => {
    if (!onChangeStart() || activeIndex < 0) return;
    const next = duplicateZone(zones, activeIndex);
    if (!next) return;
    const created = next[activeIndex + 1];
    if (created && !created.id) next[activeIndex + 1] = { ...created, id: crypto.randomUUID() };
    onChange(next);
    onSelectZone(next[activeIndex + 1]?.id ?? null);
  };

  return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl/Cmd+Z)">
            <UndoIcon /> Undo
          </Button>
          <Button variant="secondary" disabled={!canRedo} onClick={onRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
            <RedoIcon /> Redo
          </Button>
          <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div role="group" aria-label="Align selected Zone" className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {ALIGN_EDGES.map(({ edge, label }) => (
              <button
                key={edge}
                type="button"
                disabled={activeIndex < 0}
                onClick={() => align(edge)}
                aria-label={label}
                title={label}
                className="flex h-10 w-10 items-center justify-center border-r border-zinc-200 text-zinc-600 transition last:border-r-0 hover:bg-zinc-50 hover:text-indigo-600 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-300 dark:disabled:text-zinc-600"
              >
                <AlignIcon edge={edge} />
              </button>
            ))}
          </div>
          <Button variant="secondary" disabled={activeIndex < 0} onClick={duplicate}>
            <ClipboardIcon /> Duplicate Zone
          </Button>
          <Button variant="secondary" disabled={!activeZoneId} onClick={split}>
            <LayoutIcon /> Split Zone
          </Button>
        </div>

        <LayoutCanvas
          zones={zones}
          background={background}
          aspectRatio={aspectRatio}
          referenceResolution={referenceResolution}
          fillAvailable
          zonePreviews={zonePreviews}
          selectedIndex={activeIndex}
          onSelectIndex={(index) => onSelectZone(index === null ? null : (zones[index]?.id ?? null))}
          onChangeStart={onChangeStart}
          onChange={onChange}
        />
      </div>
  );
}

function AlignIcon({ edge }: { edge: AlignEdge }) {
  const horizontal = edge === "left" || edge === "center-h" || edge === "right";
  const guide = edge === "left" || edge === "top" ? 5 : edge === "right" ? 19 : 12;
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      {horizontal ? (
        <>
          <path d={`M${guide} 3v18`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d={edge === "left" ? "M8 7h8M8 12h11M8 17h6" : edge === "right" ? "M8 7h8M5 12h11M10 17h6" : "M8 7h8M5.5 12h13M9 17h6"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path d={`M3 ${guide}h18`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d={edge === "top" ? "M7 8v8M12 8v11M17 8v6" : "M7 8v8M12 5.5v13M17 9v6"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function ZoneOverview({ zones, bindings, unboundZoneIds, activeZoneId, onSelectZone }: {
  zones: LayoutZone[];
  bindings: ZoneBindingDraft[];
  unboundZoneIds: string[];
  activeZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
}) {
  return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Zone Overview</p>
        {zones.map((zone) => {
          const isUnbound = !zone.id || unboundZoneIds.includes(zone.id);
          const binding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
          // Ticket 27: report the Zone's actual bound source — Playlist, Media, or unbound.
          // "Media" rather than "Assets" matches the frames' label for a Zone bound to
          // picked assets; a widget-rendered Zone would be "Media" too, but Widgets are
          // deferred (docs/layouts/Phase1/tickets/README.md) so that case does not exist yet.
          const sourceLabel = isUnbound ? "Unbound" : binding?.source === "assets" ? "Media" : (binding?.playlistName ?? "Playlist");
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
                  {zone.width}×{zone.height}% · {sourceLabel}
                </span>
              </span>
              <span className={isUnbound ? "font-medium text-amber-700 dark:text-amber-400" : "font-medium text-emerald-700 dark:text-emerald-400"}>
                {isUnbound ? "Unbound" : "Bound"}
              </span>
            </button>
          );
        })}
      </div>
  );
}
