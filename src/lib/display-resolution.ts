/** Canonical display expectations shared by Playlists and Channels. */
export const DISPLAY_RESOLUTIONS = [
  { value: "1920x1080", width: 1920, height: 1080 },
  { value: "1080x1920", width: 1080, height: 1920 },
  { value: "3840x2160", width: 3840, height: 2160 },
  { value: "1280x720", width: 1280, height: 720 },
] as const;

export type DisplayResolution = (typeof DISPLAY_RESOLUTIONS)[number]["value"];

export function isDisplayResolution(value: unknown): value is DisplayResolution {
  return (
    typeof value === "string" &&
    DISPLAY_RESOLUTIONS.some((resolution) => resolution.value === value)
  );
}
