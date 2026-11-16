"use client";

// A Popover with a checkbox list: the UI kit has single Selects only. Used by Start Inventory step 2. The field shows
// the picks as removable chips (the first three, then "+N"); an empty field shows the "all" placeholder.
import { useState, type ReactNode } from "react";
import { ChevronDownIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";

export interface MultiOption {
  value: string;
  label: string;
}

const CHIPS = 3;

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  icon,
}: {
  id: string;
  options: MultiOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  /** Leading glyph inside the field. */
  icon?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const chosen = new Set(value);
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const label = (v: string) => options.find((o) => o.value === v)?.label ?? "Selected";

  function toggle(v: string, on: boolean) {
    onChange(on ? [...value, v] : value.filter((x) => x !== v));
  }

  return (
    <Popover>
      <PopoverAnchor asChild>
        <div className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
          {icon && (
            <span
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            >
              {icon}
            </span>
          )}
          <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
            {value.slice(0, CHIPS).map((v) => (
              <li
                key={v}
                className="flex max-w-48 items-center gap-1 rounded-md bg-muted py-1 pl-2.5 pr-1 text-sm"
              >
                <span className="truncate">{label(v)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${label(v)}`}
                  onClick={() => toggle(v, false)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <XIcon
                    aria-hidden="true"
                    className="h-3 w-3"
                  />
                </button>
              </li>
            ))}
            {value.length > CHIPS && <li className="rounded-md bg-muted px-2.5 py-1 text-sm">+{value.length - CHIPS}</li>}
          </ul>
          <PopoverTrigger asChild>
            <button
              id={id}
              type="button"
              aria-label={value.length === 0 ? placeholder : "Change selection"}
              className="flex min-h-8 min-w-8 flex-1 items-center justify-between gap-2 text-left text-sm focus-visible:outline-none"
            >
              <span className="truncate text-muted-foreground">{value.length === 0 ? placeholder : ""}</span>
              <ChevronDownIcon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted-foreground"
              />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
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
