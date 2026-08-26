"use client";

import { Card } from "@/components/ui/Card";
import { roundPercent } from "../geometry";
import type { LayoutZone } from "../types";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

/** Editing a number here is just another path into the same validated state as
 *  dragging on the canvas — both go through `roundPercent`, so stored geometry always
 *  carries exactly one decimal place either way. */
export function ZoneProperties({
  zone,
  onChange,
  onRemove,
  canRemove,
}: {
  zone: LayoutZone | null;
  onChange: (next: LayoutZone) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  if (!zone) {
    return (
      <Card className="p-4">
        <p className="text-sm text-zinc-400">เลือก Zone บน canvas เพื่อแก้ไขรายละเอียด</p>
      </Card>
    );
  }

  const field = (key: "x" | "y" | "width" | "height", label: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label} (%)</label>
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
    </div>
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zone properties</p>
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-red-400"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</label>
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
