import { AssetActionError } from "../domain/asset-action-error.ts";
import { labelLayout, LABEL_PAGE, mmToPoints } from "../domain/asset-label-layout.ts";
import { assertLabelFormat, assetLabelsFilename, LABEL_LIMIT, type AssetLabel, type LabelFormat } from "../domain/asset-labels.ts";
import { assetLabelRectangles } from "./asset-label-codes.ts";

type TextRenderer = (label: AssetLabel, format: LabelFormat) => Promise<Uint8Array>;
const defaultTextRenderer: TextRenderer = async (label, format) => {
  const { renderAssetLabelText } = await import("./asset-label-text.ts");
  return renderAssetLabelText(label, format);
};

export async function createAssetLabelsPdf(labels: readonly AssetLabel[], format: LabelFormat, signal: AbortSignal,
  onProgress: (completed: number) => void, renderText: TextRenderer = defaultTextRenderer) {
  if (!labels.length || labels.length > LABEL_LIMIT) throw new AssetActionError("Select between 1 and 500 assets for labels.", 400, "VALIDATION");
  assertLabelFormat(labels, format);
  signal.throwIfAborted();
  const { PDFDocument, rgb } = await import("pdf-lib");
  const document = await PDFDocument.create();
  document.setTitle("Asset labels");
  onProgress(0);
  for (let index = 0; index < labels.length; index += 1) {
    signal.throwIfAborted();
    const rectangles = await assetLabelRectangles(labels[index], format);
    const text = await renderText(labels[index], format);
    signal.throwIfAborted();
    const page = document.addPage([LABEL_PAGE.width, LABEL_PAGE.height]);
    for (const rectangle of rectangles) {
      page.drawRectangle({ ...rectangle, y: LABEL_PAGE.height - rectangle.y - rectangle.height, color: rgb(0, 0, 0) });
    }
    const image = await document.embedPng(text);
    const box = labelLayout(format).text;
    page.drawImage(image, { x: mmToPoints(box.x), y: LABEL_PAGE.height - mmToPoints(box.y + box.height),
      width: mmToPoints(box.width), height: mmToPoints(box.height) });
    signal.throwIfAborted();
    onProgress(index + 1);
    // Yield between actual pages, keeping Cancel and progress responsive during a bulk job.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  signal.throwIfAborted();
  const bytes = await document.save();
  signal.throwIfAborted();
  const file = { blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), filename: assetLabelsFilename() };
  // The last work unit is serialization: prepared pages alone are not a completed PDF.
  onProgress(labels.length + 1);
  signal.throwIfAborted();
  return file;
}
