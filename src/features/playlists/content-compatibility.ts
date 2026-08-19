// Geometry check between the playlist's Output Profile (Step 1's Resolution) and an asset's own
// dimensions — ADR 0019. Warning only: nothing here blocks a selection, because the system never
// converts files (ADR 0016) and the screen scales at playback.

import type { MediaAsset } from "@/types/domain";

export type Incompatibility = "aspect" | "resolution";

/** Aspect ratios within 1% of each other are the same ratio — a file cropped a few pixels off. */
const ASPECT_TOLERANCE = 0.01;
/** Below 90% of the profile, upscaling starts to show. 720p on 1080p (67%) is the common case. */
const RESOLUTION_FLOOR = 0.9;

function parseResolution(resolution: string | undefined): { width: number; height: number } | null {
  const [width, height] = (resolution ?? "").split("x").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

/**
 * Returns why the asset does not fit the profile, or null when it fits — or when either side's
 * dimensions are unknown, which is silent by design: a warning nobody can act on trains operators
 * to ignore all of them.
 */
export function checkContentCompatibility(
  profileResolution: string | undefined,
  asset: Pick<MediaAsset, "width" | "height">
): Incompatibility | null {
  const profile = parseResolution(profileResolution);
  if (!profile) return null;
  if (!asset.width || !asset.height) return null;

  const ratioDrift = Math.abs(asset.width / asset.height / (profile.width / profile.height) - 1);
  if (ratioDrift > ASPECT_TOLERANCE) return "aspect";

  if (
    asset.width < profile.width * RESOLUTION_FLOOR ||
    asset.height < profile.height * RESOLUTION_FLOOR
  ) {
    return "resolution";
  }

  return null;
}

export function incompatibilityLabel(reason: Incompatibility): string {
  return reason === "aspect" ? "สัดส่วนไม่ตรง Profile" : "ความละเอียดต่ำกว่า Profile";
}
