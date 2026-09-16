import type { ChannelDisplayArrangement, ChannelDisplayConfig, ChannelDisplayConfigScreen } from "./types/index.ts";

export interface ArrangementOption {
  key: string;
  rows: number;
  cols: number;
  label: string;
}

/** No arrangement enum exists on the backend (`display_config.arrangement` is a free `{rows,
 *  cols}` pair) — this is the MVP preset list for the wizard's dropdown, not a contract. */
export const ARRANGEMENT_OPTIONS: readonly ArrangementOption[] = [
  { key: "1x2", rows: 1, cols: 2, label: "Horizontal (1 × 2)" },
  { key: "1x3", rows: 1, cols: 3, label: "Horizontal (1 × 3)" },
  { key: "1x4", rows: 1, cols: 4, label: "Horizontal (1 × 4)" },
  { key: "2x1", rows: 2, cols: 1, label: "Vertical (2 × 1)" },
  { key: "3x1", rows: 3, cols: 1, label: "Vertical (3 × 1)" },
  { key: "2x2", rows: 2, cols: 2, label: "Grid (2 × 2)" },
];

export function arrangementByKey(key: string): ArrangementOption {
  return ARRANGEMENT_OPTIONS.find((option) => option.key === key) ?? ARRANGEMENT_OPTIONS[1]!;
}

function parseResolution(resolution: string): { width: number; height: number } {
  const [width, height] = resolution.split("x").map(Number);
  return { width: width!, height: height! };
}

/** Matches `media_core.channel_canvas` exactly: `(cols*w)x(rows*h)`. The RPC refuses a supplied
 *  `expected_resolution` that disagrees with this, so the wizard must compute it the same way. */
export function canvasResolution(arrangement: ChannelDisplayArrangement, screenResolution: string): string {
  const { width, height } = parseResolution(screenResolution);
  return `${arrangement.cols * width}x${arrangement.rows * height}`;
}

/** D4's "Auto Map": one Screen node per cell, row-major, sequential Output labels. The Player
 *  reports no real output topology (ticket 08 deviation — confirmed live, no `outputs` field
 *  exists), so labels are a plain editable placeholder, never claimed as "detected". */
export function autoMapScreens(
  arrangement: ChannelDisplayArrangement,
  screenResolution: string,
): ChannelDisplayConfigScreen[] {
  const count = arrangement.rows * arrangement.cols;
  return Array.from({ length: count }, (_, index) => ({
    index,
    resolution: screenResolution,
    output: `Output ${index + 1}`,
  }));
}

export function buildDisplayConfig(
  arrangement: ChannelDisplayArrangement,
  screens: ChannelDisplayConfigScreen[],
): ChannelDisplayConfig {
  return { mode: "multi", arrangement, screens };
}
