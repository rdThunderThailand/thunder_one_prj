// The Layout geometry rules from ADR 0044 §3, kept pure so the editor can validate live and
// the whole rule set is checkable without React — see geometry.check.mts. media_layout_upsert
// enforces the same rules server-side and is the authority; this copy exists only to produce
// the same verdict earlier and in Thai.

import type { ZoneRect } from "./types";

export const MAX_ZONES = 4;

/** Percentages carry one decimal place (docs/layouts/contract-v2-zones.md). Comparing them
 *  as tenths keeps every check on integers, so 33.3 + 33.3 + 33.4 lands on exactly 100
 *  instead of a float a hair over it that would fail the bounds test. */
export function toTenths(value: number): number {
  return Math.round(value * 10);
}

export function roundPercent(value: number): number {
  return toTenths(value) / 10;
}

/** Touching edges are not an overlap: a 0–50 / 50–100 split is the commonest Layout there
 *  is, and a `<=` here would reject it. */
export function rectsOverlap(a: ZoneRect, b: ZoneRect): boolean {
  return (
    toTenths(a.x) < toTenths(b.x) + toTenths(b.width) &&
    toTenths(b.x) < toTenths(a.x) + toTenths(a.width) &&
    toTenths(a.y) < toTenths(b.y) + toTenths(b.height) &&
    toTenths(b.y) < toTenths(a.y) + toTenths(a.height)
  );
}

export type GeometryError =
  | { kind: "no-zones" }
  | { kind: "too-many-zones"; count: number }
  | { kind: "non-positive"; index: number }
  | { kind: "out-of-bounds"; index: number }
  | { kind: "overlap"; a: number; b: number };

export function validateZones(zones: ZoneRect[]): GeometryError[] {
  const errors: GeometryError[] = [];
  if (zones.length === 0) errors.push({ kind: "no-zones" });
  if (zones.length > MAX_ZONES) errors.push({ kind: "too-many-zones", count: zones.length });

  zones.forEach((zone, index) => {
    // A zero-area Zone fails on its own terms; reporting it as out-of-bounds too would
    // just be the same mistake counted twice.
    if (toTenths(zone.width) <= 0 || toTenths(zone.height) <= 0) {
      errors.push({ kind: "non-positive", index });
      return;
    }
    if (
      toTenths(zone.x) < 0 ||
      toTenths(zone.y) < 0 ||
      toTenths(zone.x) + toTenths(zone.width) > 1000 ||
      toTenths(zone.y) + toTenths(zone.height) > 1000
    ) {
      errors.push({ kind: "out-of-bounds", index });
    }
  });

  // At most four Zones means at most six comparisons.
  // ponytail: O(n²) over a hard cap of 4 — switch to a sweep line only if the cap rises.
  for (let a = 0; a < zones.length - 1; a += 1) {
    for (let b = a + 1; b < zones.length; b += 1) {
      if (rectsOverlap(zones[a], zones[b])) errors.push({ kind: "overlap", a, b });
    }
  }

  return errors;
}

/** Keeps a dragged or typed rectangle inside the frame instead of rejecting it: the editor
 *  clamps while the pointer moves and only blocks the save. */
export function clampRect(rect: ZoneRect): ZoneRect {
  const width = Math.min(Math.max(roundPercent(rect.width), 0.1), 100);
  const height = Math.min(Math.max(roundPercent(rect.height), 0.1), 100);
  return {
    width,
    height,
    x: Math.min(Math.max(roundPercent(rect.x), 0), 100 - width),
    y: Math.min(Math.max(roundPercent(rect.y), 0), 100 - height),
  };
}

/** "16:9" → [16, 9]. Anything unparseable falls back to 16:9 rather than throwing: a bad
 *  stored value must render a box, never crash a list row. */
export function parseAspectRatio(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!match) return [16, 9];
  const w = Number(match[1]);
  const h = Number(match[2]);
  return w > 0 && h > 0 ? [w, h] : [16, 9];
}
