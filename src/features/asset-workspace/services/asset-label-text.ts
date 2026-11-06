import { labelNameLines } from "../domain/asset-label-layout.ts";
import type { AssetLabel } from "../domain/asset-labels.ts";

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
export async function renderAssetLabelText(label: AssetLabel): Promise<Uint8Array> {
  const { thai, latin } = await loadAssetLabelFonts(label);
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  const drawing = canvas.getContext("2d");
  if (!drawing) throw new Error("Label text could not be drawn");
  // Print artwork uses black ink, independent of the app's semantic UI colors.
  drawing.fillStyle = "black";
  let tagSize = 72;
  drawing.font = `600 ${tagSize}px ${latin}`;
  while (drawing.measureText(label.assetTag).width > 860 && tagSize > 12) {
    tagSize -= 2;
    drawing.font = `600 ${tagSize}px ${latin}`;
  }
  drawing.fillText(label.assetTag, 20, 100);
  drawing.font = `600 84px ${thai}`;
  const lines = labelNameLines(label.name, (text) => drawing.measureText(text).width, 860);
  lines.forEach((line, index) => drawing.fillText(line, 20, 250 + index * 115));
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Label text could not be encoded")), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}
