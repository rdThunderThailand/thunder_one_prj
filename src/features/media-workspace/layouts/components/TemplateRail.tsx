"use client";

import { LAYOUT_TEMPLATES } from "../templates";
import type { LayoutZone } from "../types";
import { LayoutWireframe } from "./LayoutWireframe";

/** A Layout must have at least one Zone (ADR 0044 §3), so an empty canvas is never a
 *  legal state to sit in — "Start blank" seeds a single full-screen main Zone instead. */
const BLANK_ZONES: LayoutZone[] = [{ position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 }];

export function TemplateRail({
  background,
  onSelect,
}: {
  background: string;
  onSelect: (zones: LayoutZone[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Presets</p>
        <p className="text-xs text-muted-foreground">Replaces every Zone on the canvas.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onSelect(BLANK_ZONES)}
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-2 text-center hover:border-primary/30 hover:bg-primary-soft"
      >
        <span className="flex aspect-video w-full items-center justify-center rounded border border-border text-xs text-muted-foreground">
          Blank
        </span>
        <span className="text-xs font-medium text-muted-foreground">Start blank</span>
      </button>

      {LAYOUT_TEMPLATES.map((template) => (
        <button
          key={template.key}
          type="button"
          onClick={() => onSelect(template.zones)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-2 text-center hover:border-primary/30 hover:bg-primary-soft"
        >
          <LayoutWireframe
            zones={template.zones}
            background={background}
            aspectRatio="16:9"
            className="w-full rounded border border-border"
          />
          <span className="text-xs font-medium text-muted-foreground">{template.name}</span>
        </button>
      ))}
      </div>
    </div>
  );
}
