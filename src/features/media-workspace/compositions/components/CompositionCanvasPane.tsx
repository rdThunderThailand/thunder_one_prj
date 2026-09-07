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
import { ArrowLeftIcon, ArrowRightIcon, ClipboardIcon, LayoutIcon, MinusIcon, RedoIcon, TargetIcon, UndoIcon } from "@/components/ui/icons";
import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import { splitZone } from "@/features/media-workspace/layouts/split-zone";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { ZoneBindingDraft } from "../zone-bindings";

type ZonePreview = { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string };

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
          {ALIGN_EDGES.map(({ edge, label }) => (
            <Button key={edge} variant="secondary" disabled={activeIndex < 0} onClick={() => align(edge)}>
              <AlignIcon edge={edge} /> {label}
            </Button>
          ))}
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
  if (edge === "left") return <ArrowLeftIcon />;
  if (edge === "right") return <ArrowRightIcon />;
  if (edge === "top") return <TargetIcon className="h-4 w-4 rotate-90" />;
  if (edge === "middle-v") return <MinusIcon />;
  return <TargetIcon />;
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
