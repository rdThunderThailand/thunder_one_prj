"use client";

import type { SchedulePreset } from "../../../schedule-preset";

// ADR 0082 §2: the same eight presets in the wizard and here; every stored shape maps onto one.
const PRESETS: { id: SchedulePreset; label: string; hint: string }[] = [
  { id: "everyday", label: "Every day", hint: "ออกอากาศทุกวัน" },
  { id: "weekdays", label: "Weekdays", hint: "จันทร์ - ศุกร์" },
  { id: "weekends", label: "Weekends", hint: "เสาร์ - อาทิตย์" },
  { id: "date-range", label: "Date range", hint: "กำหนดช่วงวันที่" },
  { id: "custom-days", label: "Custom days", hint: "เลือกวันเอง" },
  { id: "monthly", label: "Monthly", hint: "วันเดิมทุกเดือน" },
  { id: "one-time", label: "One-time only", hint: "ออกอากาศครั้งเดียว" },
  { id: "continuous", label: "Continuous", hint: "ออกอากาศต่อเนื่องไม่หยุด" },
];

function PresetRow({ label, hint, isOn, onClick }: { label: string; hint: string; isOn: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isOn}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${
        isOn ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${isOn ? "border-[5px] border-primary" : "border-border"}`} />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

export function SchedulePresetList({
  value,
  className,
  onSelect,
}: {
  value: SchedulePreset | null;
  className?: string;
  onSelect: (preset: SchedulePreset) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Schedule Preset"
      className={`flex flex-col gap-2 ${className ?? ""}`}
    >
      <p className="text-sm font-semibold text-foreground">Schedule Preset</p>
      {PRESETS.map((p) => (
        <PresetRow
          key={p.id}
          label={p.label}
          hint={p.hint}
          isOn={value === p.id}
          onClick={() => onSelect(p.id)}
        />
      ))}
    </div>
  );
}
