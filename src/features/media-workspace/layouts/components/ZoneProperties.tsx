"use client";

import { parseResolution, referencePixels, roundPercent } from "../geometry";
import type { LayoutZone } from "../types";

const inputClasses =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClasses = "text-[9px] font-medium uppercase tracking-wide text-muted-foreground";

/** Editing a number here is just another path into the same validated state as
 *  dragging on the canvas — both go through `roundPercent`, so stored geometry always
 *  carries exactly one decimal place either way. */
export function ZoneProperties({
  zone,
  zoneIndex,
  referenceResolution = null,
  onChange,
  onRemove,
  canRemove,
}: {
  zone: LayoutZone;
  zoneIndex: number;
  referenceResolution?: string | null;
  onChange: (next: LayoutZone) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;

  const field = (key: "x" | "y" | "width" | "height", label: string) => (
    <div className="flex flex-col gap-1">
      <label className={labelClasses}>{label} (%)</label>
      <input
        type="number"
        step={0.001}
        min={key === "width" || key === "height" ? 0.1 : 0}
        max={100}
        value={zone[key]}
        onChange={(e) => {
          const raw = Number.parseFloat(e.target.value);
          if (Number.isNaN(raw)) return;
          onChange({ ...zone, [key]: roundPercent(raw) });
        }}
        className={inputClasses}
      />
      {resolution && (
        <span className="text-[11px] text-muted-foreground">
          ≈ {referencePixels(zone[key], key === "x" || key === "width" ? resolution[0] : resolution[1])}px
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-foreground">Zone Properties</p>
          <p className="text-xs font-semibold text-primary">Zone {String.fromCharCode(65 + zoneIndex)} ({zone.name})</p>
        </div>
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-xs font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClasses}>Zone Name</label>
        <input
          value={zone.name}
          onChange={(e) => onChange({ ...zone, name: e.target.value })}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("x", "X")}
        {field("y", "Y")}
        {field("width", "Width")}
        {field("height", "Height")}
      </div>
    </div>
  );
}
