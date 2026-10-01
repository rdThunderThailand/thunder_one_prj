"use client";

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** 1-31 day picker for the Monthly preset. A month without a chosen day is skipped (Core's rule). */
export function MonthDaysGrid({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1.5">
        {MONTH_DAYS.map((day) => {
          const isOn = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isOn}
              onClick={() => onChange(isOn ? value.filter((d) => d !== day) : [...value, day])}
              className={
                isOn
                  ? "rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-md bg-muted py-1.5 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {day}
            </button>
          );
        })}
      </div>
      {value.some((day) => day > 28) && (
        <p className="text-xs text-muted-foreground">Months that do not have day 29, 30 or 31 are skipped.</p>
      )}
    </div>
  );
}
