import { LABEL_LAYOUT, mmToPoints, type LabelRectangle } from "../domain/asset-label-layout.ts";
import { assertLabelFormat, type AssetLabel, type LabelFormat } from "../domain/asset-labels.ts";

type Box = { x: number; y: number; width: number; height: number };

function barcodeRectangles(bits: string, box: Box): LabelRectangle[] {
  const moduleWidth = mmToPoints(box.width) / (bits.length + 20); // Code128 quiet zones: 10 modules per side.
  const rectangles: LabelRectangle[] = [];
  for (let index = 0; index < bits.length;) {
    if (bits[index] !== "1") { index += 1; continue; }
    const start = index;
    while (bits[index] === "1") index += 1;
    rectangles.push({ x: mmToPoints(box.x) + (start + 10) * moduleWidth, y: mmToPoints(box.y),
      width: (index - start) * moduleWidth, height: mmToPoints(box.height) });
  }
  return rectangles;
}

async function code128Rectangles(assetTag: string, box: Box) {
  const { default: JsBarcode } = await import("jsbarcode");
  const barcode: { encodings?: { data: string }[] } = {};
  JsBarcode(barcode, assetTag, { format: "CODE128", displayValue: false, margin: 0 });
  const bits = barcode.encodings?.map((part) => part.data).join("");
  if (!bits || !/^[01]+$/.test(bits)) throw new Error("Code128 encoding failed");
  return barcodeRectangles(bits, box);
}

async function qrRectangles(qrValue: string, box: Box) {
  const QRCode = await import("qrcode");
  const qr = QRCode.create(qrValue, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const unit = mmToPoints(box.width) / (size + 8); // Four-module QR quiet zone.
  const rectangles: LabelRectangle[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size;) {
      if (!qr.modules.get(row, column)) { column += 1; continue; }
      const start = column;
      while (column < size && qr.modules.get(row, column)) column += 1;
      rectangles.push({ x: mmToPoints(box.x) + (start + 4) * unit,
        y: mmToPoints(box.y) + (row + 4) * unit, width: (column - start) * unit, height: unit });
    }
  }
  return rectangles;
}

/** Public encoder APIs only; preview and PDF share exactly the same vector geometry. */
export async function assetLabelRectangles(label: AssetLabel, format: LabelFormat): Promise<LabelRectangle[]> {
  assertLabelFormat([label], format);
  const layout: { qr?: Box; barcode?: Box } = LABEL_LAYOUT[format];
  const [qr, barcode] = await Promise.all([
    layout.qr ? qrRectangles(label.qrValue, layout.qr) : [],
    layout.barcode ? code128Rectangles(label.assetTag, layout.barcode) : [],
  ]);
  return [...qr, ...barcode];
}
