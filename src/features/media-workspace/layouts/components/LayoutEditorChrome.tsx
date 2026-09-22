"use client";

// Header, toolbar and Zone Overview of the Template editor — the same three pieces the
// Composition editor has, on the Lovable `layout-editor` skeleton (ADR 0076). Kept together
// because a Template has no content: none of them needs bindings, lock or hide state.

import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ExpandIcon, LayoutIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { duplicateZone } from "../align-zones";
import { parseResolution, referencePixels } from "../geometry";
import { evenSplitColumns, splitZone } from "../split-zone";
import type { LayoutStatus, LayoutZone } from "../types";

const zoneLetter = (index: number) => String.fromCharCode(65 + index);

export function LayoutEditorHeader({ isExisting, name, status, referenceResolution, aspectRatio, zoneCount, isDirty, saving, saveDisabledReason, onBack, onSave }: {
  isExisting: boolean;
  name: string;
  status: LayoutStatus;
  referenceResolution: string | null;
  aspectRatio: string;
  zoneCount: number;
  isDirty: boolean;
  saving: boolean;
  saveDisabledReason: string | null;
  onBack: () => void;
  onSave: () => void;
}) {
  const title = name.trim() || (isExisting ? "Untitled Template" : "New Template");
  return (
    <div className="flex min-h-[68px] shrink-0 flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Templates"
          title="Back to Templates"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ArrowLeftIcon />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-[11px] text-muted-foreground">Templates <span aria-hidden="true">›</span> {title}</p>
          <h1 className="min-w-0 break-words text-sm font-bold leading-tight text-foreground">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status === "active" ? "success" : "neutral"} className="rounded-full px-2 py-0 text-[10px]">{status === "active" ? "Active" : "Inactive"}</Badge>
            <span className="text-xs text-muted-foreground">
              {referenceResolution ?? aspectRatio} · {zoneCount} {zoneCount === 1 ? "Zone" : "Zones"} · <span aria-live="polite" className={isDirty ? "font-semibold text-warning" : undefined}>{isDirty ? "Unsaved changes" : "Saved"}</span>
            </span>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={onSave} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
        {saving ? "กำลังบันทึก..." : "Save Template"}
      </Button>
    </div>
  );
}

export function LayoutEditorToolbar({ zones, selectedIndex, onSelectIndex, onChange, onFit }: {
  zones: LayoutZone[];
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  /** Receives Zones with `position` already dense — every helper below reindexes. */
  onChange: (zones: LayoutZone[]) => void;
  onFit: () => void;
}) {
  const hasSelection = selectedIndex !== null && selectedIndex < zones.length;
  const add = () => {
    const sourceIndex = hasSelection ? selectedIndex : zones.length - 1;
    const next = duplicateZone(zones, sourceIndex);
    if (!next) return;
    next[sourceIndex + 1] = { ...next[sourceIndex + 1]!, name: `Zone ${zones.length + 1}` };
    onChange(next);
    onSelectIndex(sourceIndex + 1);
  };
  const split = () => {
    if (!hasSelection) return;
    const next = splitZone(zones, selectedIndex);
    if (!next) return;
    onChange(next);
    onSelectIndex(selectedIndex + 1);
  };
  const remove = () => {
    if (!hasSelection || zones.length <= 1) return;
    onChange(zones.filter((_, index) => index !== selectedIndex).map((zone, position) => ({ ...zone, position })));
    onSelectIndex(null);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-card px-3">
      <Button size="sm" variant="outline" aria-pressed={!hasSelection} onClick={() => onSelectIndex(null)}>Select</Button>
      <Button size="sm" variant="outline" onClick={add}><PlusIcon /> Add Zone</Button>
      <Button size="sm" variant="outline" disabled={!hasSelection} onClick={split}><LayoutIcon /> Split Zone</Button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      {[2, 3, 4].map((count) => (
        <Button key={count} size="sm" variant="ghost" title={`Replace all Zones with ${count} equal columns`} onClick={() => { onChange(evenSplitColumns(count)); onSelectIndex(null); }}>
          Even split × {count}
        </Button>
      ))}
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <Button size="sm" variant="ghost" className="text-danger" disabled={!hasSelection || zones.length <= 1} onClick={remove}><TrashIcon /> Delete Zone</Button>
      <Button size="sm" variant="outline" onClick={onFit}><ExpandIcon /> Fit to Screen</Button>
      <span className="ml-auto whitespace-nowrap text-[11px] text-muted-foreground">{hasSelection ? `Selected: Zone ${zoneLetter(selectedIndex)}` : "No zone selected"}</span>
    </div>
  );
}

export function LayoutZoneOverview({ zones, selectedIndex, referenceResolution, onSelectIndex }: {
  zones: LayoutZone[];
  selectedIndex: number | null;
  referenceResolution: string | null;
  onSelectIndex: (index: number) => void;
}) {
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <h2 className="text-[11px] font-bold text-foreground">Zone Overview</h2>
      {zones.map((zone, index) => (
        <button
          key={zone.id ?? zone.position}
          type="button"
          aria-pressed={index === selectedIndex}
          onClick={() => onSelectIndex(index)}
          className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${index === selectedIndex ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-card font-semibold text-foreground">{zoneLetter(index)}</span>
          <span className="truncate font-medium">{zone.name}</span>
          <span className="whitespace-nowrap text-muted-foreground">
            {resolution ? `${referencePixels(zone.width, resolution[0])} × ${referencePixels(zone.height, resolution[1])}` : `${zone.width} × ${zone.height}%`}
          </span>
        </button>
      ))}
    </section>
  );
}
