import { LABEL_MM, type LabelFormat } from "./asset-labels.ts";

export const mmToPoints = (value: number) => value * 72 / 25.4;
export const LABEL_PAGE = { width: mmToPoints(LABEL_MM.width), height: mmToPoints(LABEL_MM.height) };
/** Coordinates start at the top left; PDF drawing converts the vertical axis. */
export const LABEL_LAYOUT = {
  // Barcode spans the full width so its bars stay wide enough to scan; QR above it on the left.
  both: {
    qr: { x: 2, y: 2, width: 17, height: 17 },
    barcode: { x: 2, y: 20, width: 46, height: 8 },
    text: { x: 20, y: 3, width: 28, height: 14 },
  },
  qr: {
    qr: { x: 2, y: 2, width: 26, height: 26 },
    text: { x: 30, y: 8, width: 18, height: 14 },
  },
  barcode: {
    barcode: { x: 2, y: 2, width: 46, height: 12 },
    text: { x: 2, y: 17, width: 46, height: 11 },
  },
} as const;
export const labelLayout = (format: LabelFormat) => LABEL_LAYOUT[format];
export type LabelRectangle = { x: number; y: number; width: number; height: number };

/** Keep Thai combining marks and surrogate pairs together when fitting the printed name. */
export function labelNameLines(name: string, measure: (text: string) => number, maxWidth: number, maxLines = 2): string[] {
  const parts = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(name.trim() || "Unnamed asset")].map((part) => part.segment);
  const lines: string[] = [];
  let line = "";
  for (const part of parts) {
    if (measure(line + part) <= maxWidth) { line += part; continue; }
    if (lines.length < maxLines - 1) { lines.push(line.trimEnd()); line = part.trimStart(); continue; }
    const characters = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(line)].map((item) => item.segment);
    while (characters.length && measure(characters.join("") + "…") > maxWidth) characters.pop();
    return [...lines, characters.join("").trimEnd() + "…"];
  }
  return [...lines, line.trimEnd()];
}
