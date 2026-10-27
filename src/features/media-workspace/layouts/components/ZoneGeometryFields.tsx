"use client";

// X/Y/W/H for one Zone, typed in percent or reference pixels. Geometry is always stored in
// percent; px is only a unit the operator types in, converted through `roundPercent`, whose
// thousandths keep a px round-trip exact for any side up to 99999.

import { useState } from "react";
import { parseResolution, referencePixels, roundPercent } from "../geometry";
import type { LayoutZone } from "../types";

type Unit = "%" | "px";
const UNIT_STORAGE_KEY = "media-workspace.zone-unit.v1";
const FIELDS = [
  ["x", "X"],
  ["y", "Y"],
  ["width", "Width"],
  ["height", "Height"],
] as const;

const inputClasses =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClasses = "text-[9px] font-medium uppercase tracking-wide text-muted-foreground";
const unitClasses = (active: boolean) =>
  `rounded-md px-2 py-0.5 text-[10px] font-medium ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`;

function storedUnit(): Unit {
  try {
    return window.localStorage.getItem(UNIT_STORAGE_KEY) === "%" ? "%" : "px";
  } catch {
    return "px";
  }
}

export function ZoneGeometryFields({
  zone,
  referenceResolution,
  onChange,
}: {
  zone: LayoutZone;
  referenceResolution: string | null;
  onChange: (next: LayoutZone) => void;
}) {
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  const [preferred, setPreferred] = useState<Unit>(() => (typeof window === "undefined" ? "px" : storedUnit()));
  // Without a reference resolution there is no pixel to convert to.
  const unit: Unit = resolution ? preferred : "%";

  const chooseUnit = (next: Unit) => {
    setPreferred(next);
    try {
      window.localStorage.setItem(UNIT_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice just lasts for this page.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={labelClasses}>Geometry</span>
        <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="Geometry unit">
          {(["%", "px"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={unit === option}
              disabled={option === "px" && !resolution}
              onClick={() => chooseUnit(option)}
              className={unitClasses(unit === option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([key, label]) => {
          const dimension = resolution ? (key === "x" || key === "width" ? resolution[0] : resolution[1]) : 0;
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className={labelClasses}>{label} ({unit})</span>
              <input
                type="number"
                step={unit === "px" ? 1 : 0.001}
                min={key === "width" || key === "height" ? (unit === "px" ? 1 : 0.1) : 0}
                max={unit === "px" ? dimension : 100}
                value={unit === "px" ? referencePixels(zone[key], dimension) : zone[key]}
                onChange={(event) => {
                  const raw = Number.parseFloat(event.target.value);
                  if (Number.isNaN(raw)) return;
                  const percent = unit === "px" ? (raw / dimension) * 100 : raw;
                  onChange({ ...zone, [key]: roundPercent(percent) });
                }}
                className={inputClasses}
              />
              {unit === "%" && resolution && (
                <span className="text-[11px] text-muted-foreground">≈ {referencePixels(zone[key], dimension)}px</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
