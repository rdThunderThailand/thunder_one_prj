import { labelLayout, labelNameLines } from "../domain/asset-label-layout.ts";
import type { AssetLabel, LabelFields, LabelFormat } from "../domain/asset-labels.ts";

export async function loadAssetLabelFonts(label: Pick<AssetLabel, "name" | "assetTag">) {
  await document.fonts.ready;
  const styles = getComputedStyle(document.documentElement);
  const thai = styles.getPropertyValue("--font-noto-sans-thai").trim();
  const latin = styles.getPropertyValue("--font-manrope").trim();
  if (!thai || !latin) throw new Error("ThunderOne label fonts are unavailable");
  await Promise.all([document.fonts.load(`600 84px ${thai}`, label.name), document.fonts.load(`600 72px ${latin}`, label.assetTag)]);
  return { thai, latin };
}

const LINE_STEP = 128;
const FIRST_BASELINE = 116;

/** Rasterize only text so the browser shapes Thai correctly; codes remain vectors. */
export async function renderAssetLabelText(label: AssetLabel, format: LabelFormat, fields: LabelFields): Promise<Uint8Array> {
  const { thai, latin } = await loadAssetLabelFonts(label);
  const canvas = document.createElement("canvas");
  const box = labelLayout(format).text;
  canvas.width = box.width * 40;
  canvas.height = box.height * 40;
  const drawing = canvas.getContext("2d");
  if (!drawing) throw new Error("Label text could not be drawn");
  // Print artwork uses black ink, independent of the app's semantic UI colors.
  drawing.fillStyle = "black";
  const textWidth = canvas.width - 40;
  const slots = Math.floor((canvas.height - FIRST_BASELINE - 24) / LINE_STEP) + 1;
  let line = 0;
  const fitted = (text: string, weight: number, size: number, family: string) => {
    drawing.font = `${weight} ${size}px ${family}`;
    while (drawing.measureText(text).width > textWidth && size > 12) {
      size -= 2;
      drawing.font = `${weight} ${size}px ${family}`;
    }
    drawing.fillText(text, 20, FIRST_BASELINE + line++ * LINE_STEP);
  };
  if (fields.assetTag) fitted(label.assetTag, 600, 96, latin);
  const serial = fields.serialNumber && label.serialNumber?.trim();
  if (serial) fitted(`S/N ${serial}`, 500, 80, `${latin}, ${thai}`);
  if (fields.name && line < slots) {
    drawing.font = `600 112px ${thai}`;
    const lines = labelNameLines(label.name, (text) => drawing.measureText(text).width, textWidth, Math.min(2, slots - line));
    lines.forEach((text) => drawing.fillText(text, 20, FIRST_BASELINE + line++ * LINE_STEP));
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Label text could not be encoded")), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}
