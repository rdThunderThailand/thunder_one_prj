// Relative rather than the `@/` alias so `preview-geometry.check.mts` runs under bare node,
// matching how `geometry.check.mts` reaches its own module.
import { deriveAspectRatio, parseAspectRatio, parseResolution } from "../layouts/geometry.ts";

/** One shape the operator can preview in. Nothing here is persisted — choosing an option
 *  reshapes the preview frame only, never the stored Layout geometry (ADR 0055). */
export type GeometryOption = {
  /** Stable select value — a normalised `WxH`, or `"unknown"` for targets reporting none. */
  id: string;
  label: string;
  /** `null` only for the Unknown group, whose frame falls back through the Layout's own geometry. */
  resolution: string | null;
  /** How many selected Devices landed in this group. */
  count: number;
};

export const UNKNOWN_GEOMETRY_ID = "unknown";

/** Groups the selected Devices' reported geometries by the `WxH` string alone — orientation is
 *  `width > height`, not a third key, so `1080x1920` and `1920x1080` separate on their own.
 *  Devices reporting nothing parseable collapse into a single `Unknown (n)` group.
 *  Ordered by the `WxH` string with Unknown last, so the list is deterministic for a given
 *  selection; the default choice is `defaultGeometry`, not this order. */
export function groupDeviceGeometries(resolutions: readonly (string | null)[]): GeometryOption[] {
  const counts = new Map<string, number>();
  let unknown = 0;
  for (const raw of resolutions) {
    const parsed = raw ? parseResolution(raw) : null;
    if (!parsed) {
      unknown += 1;
      continue;
    }
    const id = `${parsed[0]}x${parsed[1]}`;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const options: GeometryOption[] = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => ({ id, label: `${id} (${count})`, resolution: id, count }));
  if (unknown > 0) {
    options.push({ id: UNKNOWN_GEOMETRY_ID, label: `Unknown (${unknown})`, resolution: null, count: unknown });
  }
  return options;
}

/** The shape most of the selected targets actually are. Ties fall to the earlier option, so a
 *  given selection always defaults to the same group. */
export function defaultGeometry(options: readonly GeometryOption[]): GeometryOption | null {
  return options.reduce<GeometryOption | null>(
    (best, option) => (best && best.count >= option.count ? best : option),
    null,
  );
}

/** The editor has no target with which to narrow a Device list, so its only option is the
 *  Layout's own Authoring Reference Resolution. A legacy Layout has none (ADR 0050) — it gets an
 *  empty list, no selector renders, and the frame keeps the stored aspect ratio. */
export function editorGeometryOptions(referenceResolution: string | null | undefined): GeometryOption[] {
  const parsed = referenceResolution ? parseResolution(referenceResolution) : null;
  if (!parsed) return [];
  const id = `${parsed[0]}x${parsed[1]}`;
  return [{ id, label: `${id} · Authoring reference`, resolution: id, count: 1 }];
}

/** The frame's shape for a chosen option: the target's own reported geometry, else the Layout's
 *  reference resolution, else its stored aspect ratio, else `16:9`. An unparseable stored ratio
 *  falls through rather than reaching the frame, where it would collapse the preview. */
export function resolveFrameAspectRatio(
  option: GeometryOption | null,
  referenceResolution: string | null | undefined,
  aspectRatio: string | null | undefined,
): string {
  const target = option?.resolution ? parseResolution(option.resolution) : null;
  if (target) return deriveAspectRatio(target[0], target[1]);
  const reference = referenceResolution ? parseResolution(referenceResolution) : null;
  if (reference) return deriveAspectRatio(reference[0], reference[1]);
  return aspectRatio && parseAspectRatio(aspectRatio) ? aspectRatio : "16:9";
}

/** The frame's size in real pixels, for the 1:1 "Actual size" view. `null` when neither the
 *  chosen target nor the Layout reports a resolution — there is then no pixel truth to show at
 *  1:1, and the caller keeps fitting to the window instead. */
export function resolveFramePixels(
  option: GeometryOption | null,
  referenceResolution: string | null | undefined,
): [number, number] | null {
  return (option?.resolution ? parseResolution(option.resolution) : null)
    ?? (referenceResolution ? parseResolution(referenceResolution) : null);
}
