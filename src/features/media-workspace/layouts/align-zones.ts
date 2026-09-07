// Ticket 26 (ADR 0063 §5): align/distribute and duplicate, pure arithmetic on Zone
// percentages so both are checkable without React — see align-zones.check.mts.

import { clampRect, rectsOverlap, roundPercent } from "./geometry.ts";
import type { LayoutZone } from "./types/index.ts";

/** The five-button group. There is no multi-select in this editor, so every button
 *  aligns the one active Zone against the frame's own edges rather than against its
 *  siblings — the only alignment target available. */
export type AlignEdge = "left" | "center-h" | "right" | "top" | "middle-v";

export const ALIGN_EDGES: { edge: AlignEdge; label: string }[] = [
  { edge: "left", label: "Align Left" },
  { edge: "center-h", label: "Align Center" },
  { edge: "right", label: "Align Right" },
  { edge: "top", label: "Align Top" },
  { edge: "middle-v", label: "Align Middle" },
];

/** Moves x or y only — width/height are untouched, so an aligned Zone stays exactly the
 *  size it was and (per `clampRect`'s own bounds) never lands past 0–100. */
export function alignZone(zone: LayoutZone, edge: AlignEdge): LayoutZone {
  switch (edge) {
    case "left":
      return { ...zone, x: 0 };
    case "center-h":
      return { ...zone, x: roundPercent((100 - zone.width) / 2) };
    case "right":
      return { ...zone, x: roundPercent(100 - zone.width) };
    case "top":
      return { ...zone, y: 0 };
    case "middle-v":
      return { ...zone, y: roundPercent((100 - zone.height) / 2) };
  }
}

const DUPLICATE_STEP = 3;
const DUPLICATE_MAX_ATTEMPTS = 20;

/** Copies `zones[index]`, offset so the copy never sits exactly on its source. Keeps
 *  stepping the offset while the candidate overlaps an existing Zone, same as a manual
 *  drag would need to.
 *  ponytail: a bounded, ever-larger diagonal offset — not a placement solver. A layout
 *  packed edge-to-edge can exhaust the attempts and still overlap; the canvas's own
 *  red outline is the fallback, exactly as it is for an overlap made by hand. Upgrade
 *  to a real free-space search only if operators hit this in practice. */
export function duplicateZone(zones: LayoutZone[], index: number): LayoutZone[] | null {
  const source = zones[index];
  if (!source) return null;

  let candidate = clampRect(source);
  for (let attempt = 1; attempt <= DUPLICATE_MAX_ATTEMPTS; attempt += 1) {
    const offset = DUPLICATE_STEP * attempt;
    candidate = clampRect({ ...source, x: source.x + offset, y: source.y + offset });
    const overlapsSibling = zones.some((zone) => rectsOverlap(candidate, zone));
    const onSource = candidate.x === source.x && candidate.y === source.y;
    if (!overlapsSibling && !onSource) break;
  }

  const copy: LayoutZone = { ...source, id: undefined, name: `${source.name} copy`, x: candidate.x, y: candidate.y };
  return [...zones.slice(0, index + 1), copy, ...zones.slice(index + 1)].map((zone, position) => ({ ...zone, position }));
}
