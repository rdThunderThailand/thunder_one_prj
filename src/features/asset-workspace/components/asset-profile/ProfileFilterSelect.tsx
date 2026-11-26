"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";

const ALL = "__all__";

/** Frames 06 and 08 toolbar filter: label inside the box, "All" first; null means no filter. */
export function ProfileFilterSelect({ label, value, options, onChange }: {
  label: string; value: string | null; options: readonly { id: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex h-10 min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
      <span className="shrink-0 text-2xs text-muted-foreground">{label}</span>
      <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
        <SelectTrigger aria-label={label} className="h-8 min-w-0 border-0 px-0 py-0 text-xs font-medium text-foreground shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
