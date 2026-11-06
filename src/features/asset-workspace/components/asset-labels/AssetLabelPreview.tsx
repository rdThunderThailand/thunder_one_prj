"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { labelLayout, LABEL_PAGE, mmToPoints, type LabelRectangle } from "../../domain/asset-label-layout";
import { labelFormatName, type AssetLabel, type LabelFormat } from "../../domain/asset-labels";

type Preview = { label: AssetLabel; format: LabelFormat; rectangles: LabelRectangle[]; textUrl: string };
export type LabelPreviewStatus = "loading" | "ready" | "error";

export function AssetLabelPreview({ label, format, onStatus }: { label: AssetLabel; format: LabelFormat; onStatus: (status: LabelPreviewStatus) => void }) {
  const cache = useRef(new Map<LabelFormat, Preview>());
  const [snapshot, setSnapshot] = useState<Preview | null>(null);
  const [failure, setFailure] = useState<{ label: AssetLabel; format: LabelFormat; version: number } | null>(null);
  const [version, setVersion] = useState(0);
  const reportStatus = useEffectEvent(onStatus);
  // At most two artworks for the current asset; never persist them between dialogs.
  useEffect(() => {
    const entries = cache.current;
    return () => {
      for (const entry of entries.values()) URL.revokeObjectURL(entry.textUrl);
      entries.clear();
    };
  }, [label]);

  useEffect(() => {
    let active = true;
    let textUrl = "";
    let cached = false;
    const existing = cache.current.get(format);
    if (existing?.label === label) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setFailure(null);
        setSnapshot(existing);
        reportStatus("ready");
      });
      return () => { active = false; };
    }
    reportStatus("loading");
    void (async () => {
      const [{ assetLabelRectangles }, { renderAssetLabelText }] = await Promise.all([
        import("../../services/asset-label-codes"), import("../../services/asset-label-text"),
      ]);
      const [rectangles, text] = await Promise.all([assetLabelRectangles(label, format), renderAssetLabelText(label, format)]);
      if (!active) return;
      textUrl = URL.createObjectURL(new Blob([new Uint8Array(text)], { type: "image/png" }));
      const artwork = new window.Image();
      artwork.src = textUrl;
      await artwork.decode();
      if (!active) return;
      const next = { label, format, rectangles, textUrl };
      cache.current.set(format, next);
      cached = true;
      setFailure(null);
      setSnapshot(next);
      reportStatus("ready");
    })().catch(() => {
      if (active) {
        if (textUrl) URL.revokeObjectURL(textUrl);
        textUrl = "";
        setFailure({ label, format, version });
        reportStatus("error");
      }
    });
    return () => {
      active = false;
      // Completed artwork belongs to the cache; interrupted work belongs to this request.
      if (textUrl && !cached) URL.revokeObjectURL(textUrl);
    };
  }, [label, format, version]);
  const artwork = snapshot?.label === label ? snapshot : null;
  const failed = failure?.label === label && failure.format === format && failure.version === version;
  const pending = artwork?.format !== format && !failed;
  const box = artwork ? labelLayout(artwork.format).text : null;
  return (
    <figure className="space-y-3" aria-busy={pending}>
      <div className="overflow-hidden rounded-control border border-border bg-card p-3">
        <div className="relative aspect-[5/3] w-full">
          {artwork && box ? (
            // Print artwork: black ink, white stock. Its layout also drives the PDF.
            <svg
              key={artwork.format}
              viewBox={`0 0 ${LABEL_PAGE.width} ${LABEL_PAGE.height}`}
              className={`absolute inset-0 h-full w-full animate-in fade-in duration-200 ease-out motion-reduce:animate-none ${pending || failed ? "opacity-30" : ""}`}
              role="img"
              aria-hidden={pending || failed}
              aria-label={`${labelFormatName(artwork.format)} label preview for ${label.name}`}
            >
              <rect width={LABEL_PAGE.width} height={LABEL_PAGE.height} fill="white" />
              {artwork.rectangles.map((rectangle, index) => <rect key={index} {...rectangle} fill="black" />)}
              <image href={artwork.textUrl} x={mmToPoints(box.x)} y={mmToPoints(box.y)} width={mmToPoints(box.width)} height={mmToPoints(box.height)} />
            </svg>
          ) : <div aria-hidden="true" className="absolute inset-0 rounded-control bg-muted" />}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-control bg-card px-3 py-2 text-xs text-muted-foreground shadow-control">
                <SpinnerIcon aria-hidden="true" className="size-4 animate-spin text-primary motion-reduce:animate-none" />
                Updating preview…
              </span>
            </div>
          )}
          {failed && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-control bg-error-muted/95 p-3 text-center text-xs text-foreground">
              <p>Preview unavailable. Retry or choose another code type.</p>
              <Button variant="outline" size="sm" onClick={() => setVersion((value) => value + 1)}>Retry preview</Button>
            </div>
          )}
        </div>
      </div>
      <figcaption className="space-y-1 text-center text-xs">
        <p className="font-medium wrap-anywhere">{label.name || "Unnamed asset"}</p>
        <p className="text-muted-foreground">50 × 30 mm · {labelFormatName(format)} · Asset Tag · Asset Name</p>
        <p role="status" aria-live="polite" className="min-h-5 text-muted-foreground">
          {pending ? `Preparing ${labelFormatName(format)} preview…` : failed ? "Preview not ready" : "Preview ready"}
        </p>
      </figcaption>
    </figure>
  );
}
