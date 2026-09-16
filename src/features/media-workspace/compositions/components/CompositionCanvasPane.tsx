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

import { useState, type Dispatch, type SetStateAction } from "react";
import { ALIGN_EDGES, alignZone, duplicateZone, type AlignEdge } from "@/features/media-workspace/layouts/align-zones";
import { Button } from "@/components/ui/Button";
import { ClipboardIcon, EyeIcon, LayoutIcon, LockIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import { parseResolution, referencePixels } from "@/features/media-workspace/layouts/geometry";
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
  canDelete,
  onDelete,
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
  canDelete: boolean;
  onDelete: () => void;
}) {
  const activeIndex = zones.findIndex((zone) => zone.id === activeZoneId);
  const [lockedZoneIds, setLockedZoneIds] = useState<Set<string>>(() => new Set());
  const [hiddenZoneIds, setHiddenZoneIds] = useState<Set<string>>(() => new Set());
  const activeZone = activeIndex < 0 ? null : zones[activeIndex];
  const isActiveLocked = !!activeZone?.id && lockedZoneIds.has(activeZone.id);
  const isActiveHidden = !!activeZone?.id && hiddenZoneIds.has(activeZone.id);

  const toggleZoneState = (setter: Dispatch<SetStateAction<Set<string>>>) => {
    if (!activeZone?.id) return;
    setter((current) => {
      const next = new Set(current);
      if (next.has(activeZone.id!)) next.delete(activeZone.id!);
      else next.add(activeZone.id!);
      return next;
    });
  };

  const add = () => {
    if (!onChangeStart() || zones.length === 0) return;
    const sourceIndex = activeIndex < 0 ? zones.length - 1 : activeIndex;
    const next = duplicateZone(zones, sourceIndex);
    if (!next) return;
    const createdIndex = sourceIndex + 1;
    next[createdIndex] = { ...next[createdIndex]!, id: crypto.randomUUID(), name: `Zone ${zones.length + 1}` };
    onChange(next);
    onSelectZone(next[createdIndex]?.id ?? null);
  };

  const split = () => {
    if (activeIndex < 0 || isActiveLocked || !onChangeStart()) return;
    const next = splitZone(zones, activeIndex);
    if (!next) return;
    // The Zone the split created has no id yet; the canvas keys and binds by id, so it needs
    // one now rather than at save time.
    const created = activeIndex + 1;
    if (next[created] && !next[created].id) next[created] = { ...next[created], id: crypto.randomUUID() };
    onChange(next);
  };

  const align = (edge: (typeof ALIGN_EDGES)[number]["edge"]) => {
    if (activeIndex < 0 || isActiveLocked || !onChangeStart()) return;
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
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={add}><PlusIcon /> Add Zone</Button>
          <Button variant="secondary" disabled={!activeZoneId || isActiveLocked} onClick={split}><LayoutIcon /> Split Zone</Button>
          <div role="group" aria-label="Align selected Zone" className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {ALIGN_EDGES.map(({ edge, label }) => (
              <button
                key={edge}
                type="button"
                disabled={activeIndex < 0 || isActiveLocked}
                onClick={() => align(edge)}
                aria-label={label}
                title={label}
                className="flex h-10 w-10 items-center justify-center border-r border-zinc-200 text-zinc-600 transition last:border-r-0 hover:bg-zinc-50 hover:text-indigo-600 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-300 dark:disabled:text-zinc-600"
              >
                <AlignIcon edge={edge} />
              </button>
            ))}
          </div>
          <div role="group" aria-label="Selected Zone actions" className="flex items-center gap-1">
            <button type="button" disabled={activeIndex < 0} onClick={() => toggleZoneState(setLockedZoneIds)} aria-label={isActiveLocked ? "Unlock Zone" : "Lock Zone"} aria-pressed={isActiveLocked} title={isActiveLocked ? "Unlock Zone" : "Lock Zone"} className={`grid h-10 w-10 place-items-center rounded-lg border disabled:text-zinc-300 ${isActiveLocked ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}><LockIcon /></button>
            <button type="button" disabled={activeIndex < 0} onClick={() => toggleZoneState(setHiddenZoneIds)} aria-label={isActiveHidden ? "Show Zone" : "Hide Zone"} aria-pressed={isActiveHidden} title={isActiveHidden ? "Show Zone" : "Hide Zone"} className={`relative grid h-10 w-10 place-items-center rounded-lg border disabled:text-zinc-300 ${isActiveHidden ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}><EyeIcon />{isActiveHidden && <span className="absolute h-px w-5 -rotate-45 bg-current" />}</button>
            <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button type="button" disabled={activeIndex < 0} onClick={duplicate} aria-label="Duplicate Zone" title="Duplicate Zone" className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:text-zinc-300"><ClipboardIcon /></button>
          </div>
          </div>
          <button type="button" disabled={!canDelete || activeIndex < 0} onClick={onDelete} title={canDelete ? "Delete Zone" : "A Layout must have at least one Zone"} className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:border-zinc-200 disabled:text-zinc-300"><TrashIcon /> Delete Zone</button>
        </div>

        <LayoutCanvas
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

const zoneBadgeClasses = ["bg-violet-600", "bg-blue-600", "bg-emerald-600"];

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
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Zone Overview</p>
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
                  ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span className={`grid h-7 w-7 place-items-center rounded-md font-semibold text-white ${zoneBadgeClasses[index % zoneBadgeClasses.length]}`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="truncate font-medium">{zone.name}</span>
              <span className="whitespace-nowrap text-zinc-500">
                {resolution ? `${referencePixels(zone.width, resolution[0])} × ${referencePixels(zone.height, resolution[1])}` : `${zone.width} × ${zone.height}%`}
              </span>
              <span className="max-w-24 truncate text-zinc-500">{sourceLabel}</span>
              <span
                aria-label={isUnbound ? "Unbound" : "Bound"}
                title={isUnbound ? "Unbound" : "Bound"}
                className={`h-2 w-2 rounded-full ${isUnbound ? "bg-amber-500" : "bg-emerald-500"}`}
              />
            </button>
          );
        })}
      </div>
  );
}
