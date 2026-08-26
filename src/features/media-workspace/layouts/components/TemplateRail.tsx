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
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => onSelect(BLANK_ZONES)}
        className="flex w-32 flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-center hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-zinc-700 dark:hover:bg-indigo-500/10"
      >
        <span className="flex h-16 w-full items-center justify-center rounded border border-zinc-200 text-xs text-zinc-400 dark:border-zinc-700">
          Blank
        </span>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Start blank</span>
      </button>

      {LAYOUT_TEMPLATES.map((template) => (
        <button
          key={template.key}
          type="button"
          onClick={() => onSelect(template.zones)}
          className="flex w-32 flex-col items-center gap-2 rounded-lg border border-zinc-200 p-3 text-center hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-zinc-700 dark:hover:bg-indigo-500/10"
        >
          <LayoutWireframe
            zones={template.zones}
            background={background}
            aspectRatio="16:9"
            className="h-16 w-full rounded border border-zinc-200 dark:border-zinc-700"
          />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{template.name}</span>
        </button>
      ))}
    </div>
  );
}
