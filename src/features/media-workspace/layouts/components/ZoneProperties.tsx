"use client";

import { Card } from "@/components/ui/Card";
import { parseResolution, referencePixels, roundPercent } from "../geometry";
import type { LayoutZone } from "../types";

const inputClasses =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Editing a number here is just another path into the same validated state as
 *  dragging on the canvas — both go through `roundPercent`, so stored geometry always
 *  carries exactly one decimal place either way. */
export function ZoneProperties({
  zone,
  referenceResolution = null,
  onChange,
  onRemove,
  canRemove,
}: {
  zone: LayoutZone | null;
  referenceResolution?: string | null;
  onChange: (next: LayoutZone) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  if (!zone) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">เลือก Zone บน canvas เพื่อแก้ไขรายละเอียด</p>
      </Card>
    );
  }

  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;

  const field = (key: "x" | "y" | "width" | "height", label: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label} (%)</label>
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
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Zone properties</p>
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
        <label className="text-xs font-medium text-muted-foreground">Name</label>
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
    </Card>
  );
}
