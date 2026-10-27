"use client";

// Aurora-style preview scale: "Fit" sizes the frame to the window, a number is that fraction of
// the frame's real pixels (1.0 = actual size); the stage scrolls when the frame is larger.

import { useId } from "react";

export function PreviewScaleControl({
  scale,
  onScale,
  floating,
}: {
  scale: number | "fit";
  onScale: (next: number | "fit") => void;
  /** On the dark modal/fullscreen stage it floats over the padding instead of taking a row,
   *  so the "Fit" frame keeps the height it was sized for. */
  floating: boolean;
}) {
  const inputId = useId();
  return (
    <div className={`flex shrink-0 items-center gap-2 text-xs ${floating ? "absolute left-8 top-1.5 z-10 text-primary-foreground/80" : "text-muted-foreground"}`}>
      <label htmlFor={inputId}>Scale {scale === "fit" ? "Fit" : scale.toFixed(1)}</label>
      <input
        id={inputId}
        type="range"
        min={0.1}
        max={1}
        step={0.1}
        value={scale === "fit" ? 1 : scale}
        onChange={(event) => onScale(Number(event.target.value))}
        className="w-32 accent-primary"
      />
      <button
        type="button"
        aria-pressed={scale === "fit"}
        onClick={() => onScale("fit")}
        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${scale === "fit" ? "border-primary text-primary" : "border-border"}`}
      >
        Fit
      </button>
    </div>
  );
}
