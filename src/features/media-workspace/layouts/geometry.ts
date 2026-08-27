// The Layout geometry rules from ADR 0044 §3, kept pure so the editor can validate live and
// the whole rule set is checkable without React — see geometry.check.mts. media_layout_upsert
// enforces the same rules server-side and is the authority; this copy exists only to produce
// the same verdict earlier and in Thai.

import type { ZoneRect } from "./types";

export const MAX_ZONES = 4;

/** Percentages carry three decimal places (docs/layouts/contract-v2-zones.md) — enough for
 *  three equal columns across three monitors to land exactly on the bezels. Comparing them
 *  as thousandths keeps every check on integers, so 33.333 + 33.333 + 33.334 lands on
 *  exactly 100 instead of a float a hair over it that would fail the bounds test. */
export function toThousandths(value: number): number {
  return Math.round(value * 1000);
}

export function roundPercent(value: number): number {
  return toThousandths(value) / 1000;
}

/** Touching edges are not an overlap: a 0–50 / 50–100 split is the commonest Layout there
 *  is, and a `<=` here would reject it. */
export function rectsOverlap(a: ZoneRect, b: ZoneRect): boolean {
  return (
    toThousandths(a.x) < toThousandths(b.x) + toThousandths(b.width) &&
    toThousandths(b.x) < toThousandths(a.x) + toThousandths(a.width) &&
    toThousandths(a.y) < toThousandths(b.y) + toThousandths(b.height) &&
    toThousandths(b.y) < toThousandths(a.y) + toThousandths(a.height)
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
    if (toThousandths(zone.width) <= 0 || toThousandths(zone.height) <= 0) {
      errors.push({ kind: "non-positive", index });
      return;
    }
    if (
      toThousandths(zone.x) < 0 ||
      toThousandths(zone.y) < 0 ||
      toThousandths(zone.x) + toThousandths(zone.width) > 100000 ||
      toThousandths(zone.y) + toThousandths(zone.height) > 100000
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

/** "16:9" → [16, 9]. "5760:1080" (a spanned 3-monitor width) must parse too, so both sides
 *  take up to 5 digits — matching `layouts.reference_resolution`'s own bound. An unparseable
 *  value is `null`, a validation error the caller must handle explicitly rather than a
 *  silent 16:9 that would misrepresent what is actually stored. */
export function parseAspectRatio(value: string): [number, number] | null {
  const match = /^(\d{1,5}):(\d{1,5})$/.exec(value.trim());
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  return w > 0 && h > 0 ? [w, h] : null;
}

export type DeviceFit = "fits" | "orientation-mismatch" | "aspect-mismatch" | "unknown";

/** ponytail: 1.15 is measured, not theoretical — it must accept a taskbar-cropped 1920×1008
 *  (1.071) and a 16:10 panel (1.111), and reject 4:3 (1.333) and any video-wall ratio.
 *  Re-tune it against a fleet measurement, not by taste (ADR 0055 §4). */
const ASPECT_TOLERANCE = 1.15;

/** Layout ↔ target fit, advisory (ADR 0055). `resolution` is `media_screens_list`'s
 *  `screen_width || 'x' || screen_height`; orientation is derived from those two rather than read
 *  from `assets.orientation`, which contradicts them on real Devices. `screen_ratio` and
 *  `screen_dimension` are deliberately not consulted — both are deprecated and double-written. */
export function deviceFit(resolution: string | null, aspectRatio: string): DeviceFit {
  const device = parseAspectRatio((resolution ?? "").replace("x", ":"));
  const layout = parseAspectRatio(aspectRatio);
  if (!device || !layout) return "unknown";

  const [dw, dh] = device;
  const [lw, lh] = layout;
  // A square Device fits any Layout (ADR 0055 §3) — return before the band, or 1080x1080
  // against 16:9 falls through to a spread of 1.778 and reports a mismatch.
  if (dw === dh) return "fits";
  if (dw > dh !== lw > lh) return "orientation-mismatch";

  const deviceAR = dw / dh;
  const layoutAR = lw / lh;
  const spread = Math.max(deviceAR, layoutAR) / Math.min(deviceAR, layoutAR);
  return spread <= ASPECT_TOLERANCE ? "fits" : "aspect-mismatch";
}
