import { MAX_ZONES, evenSplitPercents, roundPercent } from "./geometry.ts";
import type { LayoutZone } from "./types/index.ts";

/** Replaces the whole frame with `count` equal-width, full-height columns — the seam
 *  positions ARE the resulting Zone edges (ADR 0050 §1–§3), so there is no separate guide
 *  overlay to draw. */
export function evenSplitColumns(count: number): LayoutZone[] {
  const widths = evenSplitPercents(count);
  let x = 0;
  return widths.map((width, position) => {
    const zone: LayoutZone = { position, name: `Zone ${position + 1}`, x, y: 0, width, height: 100 };
    x = roundPercent(x + width);
    return zone;
  });
}

export function splitZone(zones: LayoutZone[], index: number): LayoutZone[] | null {
  const source = zones[index];
  if (!source || zones.length >= MAX_ZONES) return null;
  const x = source.x ?? 0;
  const y = source.y ?? 0;
  const width = source.width ?? 0;
  const height = source.height ?? 0;
  const horizontal = width >= height;
  const firstSize = roundPercent((horizontal ? width : height) / 2);
  const secondSize = roundPercent((horizontal ? width : height) - firstSize);
  const first: LayoutZone = horizontal
    ? { ...source, x, y, width: firstSize, height }
    : { ...source, x, y, width, height: firstSize };
  const second: LayoutZone = horizontal
    ? { ...source, id: undefined, name: `${source.name} 2`, x: roundPercent(x + firstSize), y, width: secondSize, height }
    : { ...source, id: undefined, name: `${source.name} 2`, x, y: roundPercent(y + firstSize), width, height: secondSize };
  return [...zones.slice(0, index), first, second, ...zones.slice(index + 1)].map((zone, position) => ({ ...zone, position }));
}
