import { LABEL_MM } from "./asset-labels.ts";

export const mmToPoints = (value: number) => value * 72 / 25.4;
export const LABEL_PAGE = { width: mmToPoints(LABEL_MM.width), height: mmToPoints(LABEL_MM.height) };
/** Coordinates start at the top left; PDF drawing converts the vertical axis. */
export const LABEL_LAYOUT = {
  qr: { x: 2, y: 2, width: 17, height: 17 },
  text: { x: 21, y: 3, width: 27, height: 15 },
  barcode: { x: 2, y: 22, width: 46, height: 6 },
} as const;
export type LabelRectangle = { x: number; y: number; width: number; height: number };

/** Keep Thai combining marks and surrogate pairs together when fitting the printed name. */
export function labelNameLines(name: string, measure: (text: string) => number, maxWidth: number): string[] {
  const parts = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(name.trim() || "Unnamed asset")].map((part) => part.segment);
  const lines: string[] = [];
  let line = "";
  for (const part of parts) {
    if (measure(line + part) <= maxWidth) { line += part; continue; }
    if (!lines.length) { lines.push(line.trimEnd()); line = part.trimStart(); continue; }
    const characters = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(line)].map((item) => item.segment);
    while (characters.length && measure(characters.join("") + "…") > maxWidth) characters.pop();
    return [lines[0], characters.join("").trimEnd() + "…"];
  }
  return [...lines, line.trimEnd()];
}
