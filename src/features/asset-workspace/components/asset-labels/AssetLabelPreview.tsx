"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { LABEL_LAYOUT, LABEL_PAGE, mmToPoints, type LabelRectangle } from "../../domain/asset-label-layout";
import type { AssetLabel } from "../../domain/asset-labels";

type Preview = { label: AssetLabel; rectangles: LabelRectangle[]; textUrl: string; error: boolean };
export type LabelPreviewStatus = "loading" | "ready" | "error";

export function AssetLabelPreview({ label, onStatus }: { label: AssetLabel; onStatus: (status: LabelPreviewStatus) => void }) {
  const [snapshot, setSnapshot] = useState<Preview | null>(null);
  const [version, setVersion] = useState(0);
  const reportStatus = useEffectEvent(onStatus);
  useEffect(() => {
    let active = true;
    let textUrl = "";
    reportStatus("loading");
    void (async () => {
      const [{ assetLabelRectangles }, { renderAssetLabelText }] = await Promise.all([
        import("../../services/asset-label-codes"), import("../../services/asset-label-text"),
      ]);
      const [rectangles, text] = await Promise.all([assetLabelRectangles(label), renderAssetLabelText(label)]);
      if (!active) return;
      textUrl = URL.createObjectURL(new Blob([new Uint8Array(text)], { type: "image/png" }));
      const artwork = new window.Image();
      artwork.src = textUrl;
      await artwork.decode();
      if (!active) return;
      setSnapshot({ label, rectangles, textUrl, error: false });
      reportStatus("ready");
    })().catch(() => {
      if (active) { setSnapshot({ label, rectangles: [], textUrl: "", error: true }); reportStatus("error"); }
    });
    return () => { active = false; if (textUrl) URL.revokeObjectURL(textUrl); };
  }, [label, version]);
  const current = snapshot?.label === label ? snapshot : null;
  if (!current) return <Skeleton aria-label="Loading label preview" className="aspect-[5/3] w-full" />;
  if (current.error) return (
    <div role="alert" className="space-y-3 rounded-control bg-error-muted p-4 text-center text-xs">
      <p>The label preview could not be drawn. Retry to load the label artwork again.</p>
      <Button variant="outline" size="sm" onClick={() => { setSnapshot(null); setVersion((value) => value + 1); }}>Retry preview</Button>
    </div>
  );
  const box = LABEL_LAYOUT.text;
  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-control border border-border bg-card p-3">
        {/* Print artwork: black ink, white stock. No application logo on the actual label. */}
        <svg viewBox={`0 0 ${LABEL_PAGE.width} ${LABEL_PAGE.height}`} className="h-auto w-full" role="img" aria-label={`Label preview for ${label.name}`}>
          <rect width={LABEL_PAGE.width} height={LABEL_PAGE.height} fill="white" />
          {current.rectangles.map((rectangle, index) => <rect key={index} {...rectangle} fill="black" />)}
          <image href={current.textUrl} x={mmToPoints(box.x)} y={mmToPoints(box.y)} width={mmToPoints(box.width)} height={mmToPoints(box.height)} />
        </svg>
      </div>
      <figcaption className="space-y-1 text-center text-xs">
        <p className="font-medium wrap-anywhere">{label.name || "Unnamed asset"}</p>
        <p className="text-muted-foreground">50 × 30 mm · QR · Code128 · Asset Tag · Asset Name</p>
      </figcaption>
    </figure>
  );
}
