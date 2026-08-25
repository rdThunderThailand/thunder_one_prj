// The playlist Output Profile's allowed values, in one place — Step 1's Resolution and Frame
// Rate selectors, the compatibility check (ADR 0019) and every read-side display all come from
// here. Thunder_Core's playlist routes enforce the same lists on the wire; see
// docs/adr/0032-playlist-output-profile.md for why that duplication is deliberate.
//
// Relative import keeps this file compatible with the native Node runnable checks.
import { DISPLAY_RESOLUTIONS } from "../../../lib/display-resolution.ts";

export const RESOLUTIONS = DISPLAY_RESOLUTIONS;

export const FRAME_RATES = [24, 25, 30, 60] as const;

/** Splits the stored `"1920x1080"` into numbers. Null when the value is absent or malformed. */
export function parseResolution(
  resolution: string | undefined
): { width: number; height: number } | null {
  const [width, height] = (resolution ?? "").split("x").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 1920×1080 → "16:9". Computed rather than stored — it is a function of the two numbers. */
export function aspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/** `"1920x1080"` → `"1920 × 1080 (16:9)"`. An unreadable value renders as-is rather than "—". */
export function resolutionLabel(resolution: string | undefined): string {
  const parsed = parseResolution(resolution);
  if (!parsed) return resolution && resolution !== "" ? resolution : "—";
  return `${parsed.width} × ${parsed.height} (${aspectRatio(parsed.width, parsed.height)})`;
}
