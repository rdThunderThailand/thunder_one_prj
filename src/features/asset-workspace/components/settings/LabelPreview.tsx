"use client";

import { useEffect, useState } from "react";
import { LABEL_LAYOUT } from "../../domain/asset-label-layout";
import { LABEL_MM } from "../../domain/asset-labels";
import { BARCODE_QUIET_MODULES, QR_QUIET_MODULES } from "../../services/asset-label-codes";
import type { LabelFieldSettings, LabelIdentifier } from "../../domain/asset-settings";

// Sample asset, like Figma's Tag Preview. Only the saved tag format is real: the next tag comes from Settings.
const SAMPLE = { name: 'MacBook Pro 14"', serial: "C02Z45FXQ8L", category: "Electronics", location: "HQ - Office 1" };

type Shape = { width: number; path: string };
type Box = { x: number; y: number; width: number; height: number };

/** Filled runs of one row as SVG path commands: `M x y h len v 1 h -len z`. */
const run = (x: number, y: number, length: number) => `M${x} ${y}h${length}v1h-${length}z`;

/** The same public encoders as the label PDF (qrcode, jsbarcode), so the preview shows a scannable code for the sample tag. */
async function encode(tag: string): Promise<{ qr: Shape; bars: Shape }> {
  const [{ default: QRCode }, { default: JsBarcode }] = await Promise.all([import("qrcode"), import("jsbarcode")]);
  const modules = QRCode.create(tag, { errorCorrectionLevel: "M" }).modules;
  let qrPath = "";
  for (let row = 0; row < modules.size; row += 1) {
    for (let column = 0; column < modules.size; ) {
      if (!modules.get(row, column)) { column += 1; continue; }
      const start = column;
      while (column < modules.size && modules.get(row, column)) column += 1;
      qrPath += run(start, row, column - start);
    }
  }
  const barcode: { encodings?: { data: string }[] } = {};
  JsBarcode(barcode, tag, { format: "CODE128", displayValue: false, margin: 0 });
  const bits = barcode.encodings?.map((part) => part.data).join("") ?? "";
  let barPath = "";
  for (let index = 0; index < bits.length; ) {
    if (bits[index] !== "1") { index += 1; continue; }
    const start = index;
    while (bits[index] === "1") index += 1;
    barPath += run(start, 0, index - start);
  }
  return { qr: { width: modules.size, path: qrPath }, bars: { width: bits.length, path: barPath } };
}

/**
 * Largest line height (mm, at most 3) at which every line, wrapped to the box width, plus the stacked logo fit the box height.
 * A glyph is about 0.55 of the font size wide and the font is 0.8 of the line height; never below 1.4 mm.
 */
function fitLineMm(lines: string[], width: number, height: number, logoLines: number): number {
  for (let lineMm = 3; lineMm > 1.4; lineMm -= 0.1) {
    const charMm = 0.55 * 0.8 * lineMm;
    const rows = lines.reduce((sum, line) => sum + Math.max(1, Math.ceil((line.length * charMm) / width)), 0);
    if ((rows + logoLines) * lineMm <= height) return lineMm;
  }
  return 1.4;
}

/** Pixels per millimetre: the card is always the label's real size and proportion (50 × 30 mm), only scaled. */
const PX_PER_MM = 7;
/** Temporary label logo, until the organization logo is stored. */
const LOGO = "/brand/thunderone-logo-horizontal-color.svg";

/** Label Preview (Figma Labels): the real label geometry (LABEL_LAYOUT, in mm) at a fixed scale, so QR, barcode and text sit where the PDF puts them. */
export function LabelPreview({
  identifier,
  fields,
  tag,
}: {
  identifier: LabelIdentifier;
  fields: LabelFieldSettings;
  tag: string;
}) {
  const [codes, setCodes] = useState<{ tag: string; qr: Shape; bars: Shape } | null>(null);
  useEffect(() => {
    let live = true;
    encode(tag)
      .then((next) => { if (live) setCodes({ tag, ...next }); })
      .catch(() => { if (live) setCodes(null); });
    return () => { live = false; };
  }, [tag]);
  const ready = codes?.tag === tag ? codes : null;

  const layout: { qr?: Box; barcode?: Box; text: Box } = LABEL_LAYOUT[identifier];
  const px = (mm: number) => mm * PX_PER_MM;
  const box = (b: Box) => ({ left: px(b.x), top: px(b.y), width: px(b.width), height: px(b.height) });

  const lines = [
    fields.name ? SAMPLE.name : null,
    tag,
    fields.serial ? `SN: ${SAMPLE.serial}` : null,
    fields.category ? `Category: ${SAMPLE.category}` : null,
    fields.location ? `Location: ${SAMPLE.location}` : null,
  ].filter((line): line is string => line !== null);
  // A wide text box (barcode only) puts the logo on the right, beside the text; a narrow one stacks it above.
  const logoBeside = layout.text.width >= 40;
  const logoLines = fields.logo && !logoBeside ? 1.6 : 0;
  const textWidth = logoBeside && fields.logo ? layout.text.width * 0.55 : layout.text.width;
  const lineMm = fitLineMm(lines, textWidth, layout.text.height, logoLines);

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-sm font-semibold text-foreground">Label Preview</figcaption>
      <div className="max-w-full overflow-x-auto">
        <div
          role="img"
          aria-label={`Label preview for ${tag}, ${LABEL_MM.width} by ${LABEL_MM.height} millimetres`}
          className="relative shrink-0 overflow-hidden rounded-md border border-border bg-card"
          style={{ width: px(LABEL_MM.width), height: px(LABEL_MM.height) }}
        >
          {layout.qr && (
            <svg
              aria-hidden="true"
              viewBox={ready ? `${-QR_QUIET_MODULES} ${-QR_QUIET_MODULES} ${ready.qr.width + 2 * QR_QUIET_MODULES} ${ready.qr.width + 2 * QR_QUIET_MODULES}` : "0 0 1 1"}
              shapeRendering="crispEdges"
              className="absolute"
              style={box(layout.qr)}
            >
              {ready && <path d={ready.qr.path} className="fill-foreground" />}
            </svg>
          )}
          {layout.barcode && (
            <svg
              aria-hidden="true"
              viewBox={ready ? `${-BARCODE_QUIET_MODULES} 0 ${ready.bars.width + 2 * BARCODE_QUIET_MODULES} 1` : "0 0 1 1"}
              preserveAspectRatio="none"
              shapeRendering="crispEdges"
              className="absolute"
              style={box(layout.barcode)}
            >
              {ready && <path d={ready.bars.path} className="fill-foreground" />}
            </svg>
          )}
          <div
            className={`absolute flex overflow-hidden text-foreground ${logoBeside ? "items-center justify-between gap-2" : "flex-col justify-center"}`}
            style={{ ...box(layout.text), fontSize: px(lineMm * 0.8), lineHeight: `${px(lineMm)}px` }}
          >
            {fields.logo && !logoBeside && (
              // eslint-disable-next-line @next/next/no-img-element -- a static brand SVG, like the sidebar's
              <img
                src={LOGO}
                alt=""
                style={{ height: px(lineMm * 1.4), width: "auto", marginBottom: px(lineMm * 0.2) }}
                className="self-start"
              />
            )}
            <div className={logoBeside ? "min-w-0 flex-1" : "min-w-0"}>
              {lines.map((line, index) => (
                <p
                  key={line}
                  className={index === 0 && fields.name ? "break-words font-semibold" : "break-words"}
                >
                  {line}
                </p>
              ))}
            </div>
            {fields.logo && logoBeside && (
              // eslint-disable-next-line @next/next/no-img-element -- a static brand SVG, like the sidebar's
              <img
                src={LOGO}
                alt=""
                style={{ height: px(Math.min(layout.text.height, lineMm * 2.4)), width: "auto", maxWidth: "45%" }}
                className="shrink-0 self-start"
              />
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {LABEL_MM.width} × {LABEL_MM.height} mm at {PX_PER_MM}×. Sample data; actual labels use each asset&apos;s own details.
      </p>
    </figure>
  );
}
