"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ClipboardIcon, EyeIcon, ExpandIcon, LayoutIcon, LockIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { ALIGN_EDGES, alignZone, duplicateZone, type AlignEdge } from "@/features/media-workspace/layouts/align-zones";
import { splitZone } from "@/features/media-workspace/layouts/split-zone";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";

export function CompositionEditorToolbar({
  zones,
  activeZoneId,
  lockedZoneIds,
  hiddenZoneIds,
  onLockedZoneIds,
  onHiddenZoneIds,
  onSelectZone,
  onChangeStart,
  onChange,
  onDelete,
  onFit,
}: {
  zones: LayoutZone[];
  activeZoneId: string | null;
  lockedZoneIds: Set<string>;
  hiddenZoneIds: Set<string>;
  onLockedZoneIds: Dispatch<SetStateAction<Set<string>>>;
  onHiddenZoneIds: Dispatch<SetStateAction<Set<string>>>;
  onSelectZone: (zoneId: string | null) => void;
  onChangeStart: () => boolean;
  onChange: (zones: LayoutZone[]) => void;
  onDelete: () => void;
  onFit: () => void;
}) {
  const activeIndex = zones.findIndex((zone) => zone.id === activeZoneId);
  const activeZone = activeIndex < 0 ? null : zones[activeIndex];
  const isLocked = !!activeZone?.id && lockedZoneIds.has(activeZone.id);
  const isHidden = !!activeZone?.id && hiddenZoneIds.has(activeZone.id);

  const toggle = (setter: Dispatch<SetStateAction<Set<string>>>) => {
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
    if (activeIndex < 0 || isLocked || !onChangeStart()) return;
    const next = splitZone(zones, activeIndex);
    if (!next) return;
    const createdIndex = activeIndex + 1;
    if (next[createdIndex] && !next[createdIndex].id) next[createdIndex] = { ...next[createdIndex], id: crypto.randomUUID() };
    onChange(next);
  };
  const duplicate = () => {
    if (activeIndex < 0 || !onChangeStart()) return;
    const next = duplicateZone(zones, activeIndex);
    if (!next) return;
    const createdIndex = activeIndex + 1;
    if (next[createdIndex] && !next[createdIndex].id) next[createdIndex] = { ...next[createdIndex], id: crypto.randomUUID() };
    onChange(next);
    onSelectZone(next[createdIndex]?.id ?? null);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-card px-3">
      <Button size="sm" variant="outline" aria-pressed={!activeZoneId} onClick={() => onSelectZone(null)}>Select</Button>
      <Button size="sm" variant="outline" onClick={add}><PlusIcon /> Add Zone</Button>
      <Button size="sm" variant="outline" disabled={!activeZoneId || isLocked} onClick={split}><LayoutIcon /> Split Zone</Button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <div role="group" aria-label="Align selected Zone" className="flex overflow-hidden rounded-md border border-border">
        {ALIGN_EDGES.map(({ edge, label }) => (
          <button key={edge} type="button" disabled={activeIndex < 0 || isLocked} onClick={() => {
            if (!onChangeStart()) return;
            onChange(zones.map((zone, index) => (index === activeIndex ? alignZone(zone, edge) : zone)));
          }} aria-label={label} title={label} className="grid h-8 w-8 place-items-center border-r border-border text-muted-foreground last:border-r-0 hover:bg-muted hover:text-primary disabled:opacity-40">
            <AlignIcon edge={edge} />
          </button>
        ))}
      </div>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <Button size="sm" variant="ghost" disabled={activeIndex < 0} aria-pressed={isLocked} onClick={() => toggle(onLockedZoneIds)}><LockIcon /> Lock</Button>
      <Button size="sm" variant="ghost" disabled={activeIndex < 0} aria-pressed={isHidden} onClick={() => toggle(onHiddenZoneIds)}><EyeIcon /> Hide</Button>
      <Button size="sm" variant="ghost" disabled={activeIndex < 0} onClick={duplicate}><ClipboardIcon /> Duplicate</Button>
      <Button size="sm" variant="ghost" className="text-danger" disabled={zones.length <= 1 || activeIndex < 0} onClick={onDelete}><TrashIcon /> Delete Zone</Button>
      <Button size="sm" variant="outline" onClick={onFit}><ExpandIcon /> Fit to Screen</Button>
      <span className="ml-auto text-[11px] text-muted-foreground">{activeZone ? `Selected: Zone ${String.fromCharCode(65 + activeIndex)} · ${activeZone.name}` : "No zone selected"}</span>
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
          <path d={edge === "left" ? "M8 7h8M8 12h11M8 17h6" : edge === "right" ? "M8 7h8M5 12h11M10 17h6" : "M8 7h8M5.5 12h13M9 17h6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={`M3 ${guide}h18`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d={edge === "top" ? "M7 8v8M12 8v11M17 8v6" : "M7 8v8M12 5.5v13M17 9v6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
