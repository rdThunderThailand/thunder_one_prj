"use client";

// A Popover with a checkbox list: the UI kit has single Selects only. Used by Start Inventory step 2.
import { useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";

export interface MultiOption {
  value: string;
  label: string;
}

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  options: MultiOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const chosen = new Set(value);
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? "1 selected")
        : `${value.length} selected`;

  function toggle(v: string, on: boolean) {
    onChange(on ? [...value, v] : value.filter((x) => x !== v));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={value.length ? "truncate" : "truncate text-muted-foreground"}>{summary}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 p-2"
      >
        {options.length > 8 && (
          <div className="relative mb-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Filter options"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <ul className="max-h-64 overflow-y-auto">
          {shown.map((o) => (
            <li key={o.value}>
              <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
                <Checkbox
                  checked={chosen.has(o.value)}
                  onCheckedChange={(on) => toggle(o.value, on === true)}
                />
                <span className="truncate">{o.label}</span>
              </label>
            </li>
          ))}
          {shown.length === 0 && <li className="px-2 py-3 text-sm text-muted-foreground">No matches</li>}
        </ul>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-primary hover:bg-muted"
          >
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
