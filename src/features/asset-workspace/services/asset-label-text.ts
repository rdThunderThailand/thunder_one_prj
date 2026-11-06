import { labelLayout, labelNameLines } from "../domain/asset-label-layout.ts";
import type { AssetLabel, LabelFormat } from "../domain/asset-labels.ts";

export async function loadAssetLabelFonts(label: Pick<AssetLabel, "name" | "assetTag">) {
  await document.fonts.ready;
  const styles = getComputedStyle(document.documentElement);
  const thai = styles.getPropertyValue("--font-noto-sans-thai").trim();
  const latin = styles.getPropertyValue("--font-manrope").trim();
  if (!thai || !latin) throw new Error("ThunderOne label fonts are unavailable");
  await Promise.all([document.fonts.load(`600 84px ${thai}`, label.name), document.fonts.load(`600 72px ${latin}`, label.assetTag)]);
  return { thai, latin };
}

/** Rasterize only text so the browser shapes Thai correctly; codes remain vectors. */
export async function renderAssetLabelText(label: AssetLabel, format: LabelFormat): Promise<Uint8Array> {
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
  let tagSize = 96;
  drawing.font = `600 ${tagSize}px ${latin}`;
  while (drawing.measureText(label.assetTag).width > textWidth && tagSize > 12) {
    tagSize -= 2;
    drawing.font = `600 ${tagSize}px ${latin}`;
  }
  drawing.fillText(label.assetTag, 20, 116);
  drawing.font = `600 112px ${thai}`;
  const lines = labelNameLines(label.name, (text) => drawing.measureText(text).width, textWidth);
  lines.forEach((line, index) => drawing.fillText(line, 20, 244 + index * 128));
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Label text could not be encoded")), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}
