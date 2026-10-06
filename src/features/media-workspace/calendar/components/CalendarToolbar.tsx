"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { ChannelScopePicker } from "../../channels/components/ChannelScopePicker";
import type { ChannelScope } from "../../channels/channel-scope";
import { addMonths, monthCells } from "../../publications/calendar-month";
import { HEADERS, MONTH } from "../../publications/components/edit/schedule/DatesCalendar";
import { shiftYmd } from "../../publications/schedule";
import { todayYmd } from "../calendar-day";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDay = (ymd: string) => DAY_LABEL.format(new Date(`${ymd}T00:00:00Z`));

function DatePopover({ date, onChange }: { date: string; onChange: (ymd: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(`${date.slice(0, 7)}-01`);
  const today = todayYmd();
  const pick = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(`${date.slice(0, 7)}-01`);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          {formatDay(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-72 flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <p className="text-xs font-bold text-foreground">{MONTH.format(new Date(`${month}T00:00:00Z`))}</p>
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
              className="py-1 text-[10px] text-muted-foreground"
            >
              {day}
            </span>
          ))}
          {monthCells(month).map((ymd, index) =>
            ymd ? (
              <button
                key={ymd}
                type="button"
                aria-label={ymd}
                aria-pressed={ymd === date}
                onClick={() => pick(ymd)}
                className={
                  ymd === date
                    ? "h-8 rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                    : `h-8 rounded-md text-sm hover:bg-muted ${ymd === today ? "font-semibold text-primary" : "text-foreground"}`
                }
              >
                {Number(ymd.slice(8))}
              </button>
            ) : (
              <span key={`pad-${index}`} />
            ),
          )}
        </div>
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-muted-foreground">
          Go to date
          <Input
            type="date"
            value={date}
            onChange={(event) => event.target.value && pick(event.target.value)}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}

export function CalendarToolbar({
  date,
  scope,
  onDate,
  onScope,
}: {
  date: string;
  scope: ChannelScope;
  onDate: (ymd: string) => void;
  onScope: (scope: ChannelScope) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous day"
          onClick={() => onDate(shiftYmd(date, -1))}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <DatePopover
          date={date}
          onChange={onDate}
        />
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next day"
          onClick={() => onDate(shiftYmd(date, 1))}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDate(todayYmd())}
        >
          Today
        </Button>
      </div>
      <ChannelScopePicker
        value={scope}
        onApply={onScope}
      />
    </div>
  );
}
