import { LABEL_LAYOUT, mmToPoints, type LabelRectangle } from "../domain/asset-label-layout.ts";
import { assertLabelTags, type AssetLabel } from "../domain/asset-labels.ts";

function barcodeRectangles(bits: string): LabelRectangle[] {
  const box = LABEL_LAYOUT.barcode;
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

/** Public encoder APIs only; preview and PDF share exactly the same vector geometry. */
export async function assetLabelRectangles(label: AssetLabel): Promise<LabelRectangle[]> {
  assertLabelTags([label]);
  const [{ default: JsBarcode }, QRCode] = await Promise.all([import("jsbarcode"), import("qrcode")]);
  const barcode: { encodings?: { data: string }[] } = {};
  JsBarcode(barcode, label.assetTag, { format: "CODE128", displayValue: false, margin: 0 });
  const bits = barcode.encodings?.map((part) => part.data).join("");
  if (!bits || !/^[01]+$/.test(bits)) throw new Error("Code128 encoding failed");
  const qr = QRCode.create(label.qrValue, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const unit = mmToPoints(LABEL_LAYOUT.qr.width) / (size + 8); // Four-module QR quiet zone.
  const rectangles = barcodeRectangles(bits);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size;) {
      if (!qr.modules.get(row, column)) { column += 1; continue; }
      const start = column;
      while (column < size && qr.modules.get(row, column)) column += 1;
      rectangles.push({ x: mmToPoints(LABEL_LAYOUT.qr.x) + (start + 4) * unit,
        y: mmToPoints(LABEL_LAYOUT.qr.y) + (row + 4) * unit, width: (column - start) * unit, height: unit });
    }
  }
  return rectangles;
}
