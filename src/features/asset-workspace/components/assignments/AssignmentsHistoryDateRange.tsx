"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { ChevronDownIcon } from "@/components/ui/icons";
import { isCalendarDate } from "../../domain/registration-warranty-dates";
import { RegistrationDateField } from "../register-asset/RegistrationDateField";
import type { ListUrlState } from "../list-page/useListUrlState";
import { assignmentHistoryRangeLabel } from "../../domain/assignment-history";

/** Frame 09 "Date Range" filter: house dd/mm/yyyy fields + calendar; the URL only gets complete, ordered dates. */
export function AssignmentsHistoryDateRange({ url }: { url: ListUrlState }) {
  const from = url.get("date_from") ?? "";
  const to = url.get("date_to") ?? "";
  const [draft, setDraft] = useState({ from, to });
  const [open, setOpen] = useState(false);
  const reversed = isCalendarDate(draft.from) && isCalendarDate(draft.to) && draft.from > draft.to;
  const incomplete = (value: string) => value !== "" && !isCalendarDate(value);
  const canApply = !reversed && !incomplete(draft.from) && !incomplete(draft.to)
    && (draft.from !== from || draft.to !== to);
  const change = (key: "from" | "to") => (value: string) => setDraft((previous) => ({ ...previous, [key]: value }));

  // Apply once: a URL change re-renders the list and would close the popover mid-range.
  function apply(next: { from: string; to: string }) {
    setOpen(false);
    url.set({ date_from: next.from || undefined, date_to: next.to || undefined });
  }

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft({ from, to }); }}>
      <PopoverTrigger asChild>
        <button type="button" disabled={url.isPending}
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
          <span className="shrink-0 text-2xs text-muted-foreground">Date Range</span>
          <span className="min-w-0 flex-1 truncate">{assignmentHistoryRangeLabel(from, to)}</span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} aria-label="Date range"
        className="w-[min(30rem,calc(100vw-2rem))] space-y-3 rounded-control p-4 motion-reduce:animate-none">
        <div className="grid gap-3 sm:grid-cols-2">
          <RegistrationDateField
            name="history-date-from"
            label="From"
            value={draft.from}
            onChange={change("from")}
            error={incomplete(draft.from) ? "Enter a date as dd/mm/yyyy." : undefined}
          />
          <RegistrationDateField
            name="history-date-to"
            label="To"
            value={draft.to}
            onChange={change("to")}
            error={incomplete(draft.to) ? "Enter a date as dd/mm/yyyy." : reversed ? "To must be on or after From." : undefined}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="ghost" size="sm" disabled={!from && !to && !draft.from && !draft.to} onClick={() => apply({ from: "", to: "" })}>
            Clear dates
          </Button>
          <Button size="sm" disabled={!canApply} onClick={() => apply(draft)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
