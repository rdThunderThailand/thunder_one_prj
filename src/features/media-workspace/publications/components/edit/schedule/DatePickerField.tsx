"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Label } from "@/components/ui/lovable/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { addMonths, monthCells } from "../../../calendar-month";
import { formatDmy } from "../../../schedule";
import { HEADERS, MONTH } from "./DatesCalendar";

/**
 * One date, shown as dd/mm/yyyy on every machine (QA 2026-10-08 #20). A native `type="date"` prints
 * in the browser's locale, so the field is a button over the same month grid the Custom Days picker
 * uses; days before `min` cannot be picked (ADR 0090).
 */
export function DatePickerField({ id, label, value, min, disabled, onChange }: {
  id: string;
  label: string;
  /** "YYYY-MM-DD", or "" when nothing is picked. */
  value: string;
  min?: string;
  disabled?: boolean;
  onChange: (ymd: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(`${(value || min || new Date().toISOString()).slice(0, 7)}-01`);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          if (open && value) setMonth(`${value.slice(0, 7)}-01`);
          setIsOpen(open);
        }}
      >
        <PopoverTrigger
          id={id}
          type="button"
          disabled={disabled}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={value ? "" : "text-muted-foreground"}>{value ? formatDmy(value) : "dd/mm/yyyy"}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">{MONTH.format(new Date(`${month}T00:00:00Z`))}</p>
            <button
              type="button"
              aria-label="Next month"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {HEADERS.map((day) => (
              <span
                key={day}
                className="py-1 text-xs text-muted-foreground"
              >
                {day}
              </span>
            ))}
            {monthCells(month).map((ymd, index) =>
              ymd ? (
                <button
                  key={ymd}
                  type="button"
                  aria-pressed={ymd === value}
                  aria-label={formatDmy(ymd)}
                  disabled={!!min && ymd < min}
                  onClick={() => {
                    onChange(ymd);
                    setIsOpen(false);
                  }}
                  className={
                    ymd === value
                      ? "h-8 rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                      : "h-8 rounded-md text-sm text-foreground hover:bg-muted disabled:text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent"
                  }
                >
                  {Number(ymd.slice(8))}
                </button>
              ) : (
                <span key={`pad-${index}`} />
              ),
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
