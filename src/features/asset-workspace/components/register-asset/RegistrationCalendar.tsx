import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { isCalendarDate } from "../../domain/registration-warranty-dates";
import { RegistrationYearGrid } from "./RegistrationYearGrid";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, index, 1))));

export function RegistrationCalendar({ value, today, onSelect }: { value: string; today: string; onSelect: (value: string) => void }) {
  const initial = isCalendarDate(value) ? value : today;
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [focused, setFocused] = useState(initial);
  const [choosingYear, setChoosingYear] = useState(false);
  const daysRef = useRef<HTMLDivElement>(null);
  const yearTriggerRef = useRef<HTMLButtonElement>(null);
  const first = new Date(`${month}-01T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const end = new Date(first);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const dates = Array.from({ length: end.getUTCDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);

  function showMonth(next: string) {
    if (!isCalendarDate(`${next}-01`)) return;
    setMonth(next);
    setFocused(`${next}-01`);
  }

  function moveMonth(amount: number) {
    const date = new Date(first);
    date.setUTCMonth(date.getUTCMonth() + amount);
    showMonth(date.toISOString().slice(0, 7));
  }

  function handleDayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const next = new Date(`${date}T00:00:00Z`);
    const weekday = (next.getUTCDay() + 6) % 7;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    if (event.key in moves) next.setUTCDate(next.getUTCDate() + moves[event.key]);
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + (event.key === "PageUp" ? -1 : 1));
      const last = new Date(next);
      last.setUTCMonth(last.getUTCMonth() + 1, 0);
      next.setUTCDate(Math.min(day, last.getUTCDate()));
    } else return;
    event.preventDefault();
    const target = next.toISOString().slice(0, 10);
    if (!isCalendarDate(target)) return;
    setMonth(target.slice(0, 7));
    setFocused(target);
    requestAnimationFrame(() => daysRef.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${target}"]`)?.focus());
  }

  if (choosingYear) {
    return (
      <RegistrationYearGrid
        year={Number(month.slice(0, 4))}
        onBack={() => {
          setChoosingYear(false);
          requestAnimationFrame(() => yearTriggerRef.current?.focus());
        }}
        onChoose={(year) => {
          showMonth(`${String(year).padStart(4, "0")}-${month.slice(5)}`);
          setChoosingYear(false);
          requestAnimationFrame(() => daysRef.current?.querySelector<HTMLButtonElement>("[data-calendar-date][tabindex='0']")?.focus());
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" disabled={month === "0001-01"} onClick={() => moveMonth(-1)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Select value={month.slice(5)} onValueChange={(next) => showMonth(`${month.slice(0, 4)}-${next}`)}>
          <SelectTrigger aria-label="Calendar month" className="h-8 min-w-0 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((name, index) => <SelectItem key={name} value={String(index + 1).padStart(2, "0")}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          ref={yearTriggerRef} variant="outline" size="sm" aria-label="Choose year" className="w-20 justify-between px-2 font-normal"
          onClick={() => setChoosingYear(true)}
        >
          {Number(month.slice(0, 4))}
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" disabled={month === "9999-12"} onClick={() => moveMonth(1)}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">{monthNames[Number(month.slice(5)) - 1]} {Number(month.slice(0, 4))}</p>
      <div ref={daysRef} className="grid grid-cols-7 gap-1 text-center" aria-label="Calendar dates">
        {weekdays.map((day) => <span key={day} className="py-1 text-xs text-muted-foreground">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
        {dates.map((date) => (
          <Button
            key={date} data-calendar-date={date} variant={date === value ? "primary" : "ghost"} size="sm"
            className={`h-8 min-w-0 px-0 font-normal ${date === today && date !== value ? "border border-primary text-primary" : ""}`}
            tabIndex={date === focused ? 0 : -1} aria-label={date} aria-pressed={date === value}
            aria-current={date === today ? "date" : undefined}
            onFocus={() => setFocused(date)} onKeyDown={(event) => handleDayKey(event, date)} onClick={() => onSelect(date)}
          >
            {Number(date.slice(8))}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <Button variant="ghost" size="sm" onClick={() => onSelect("")} disabled={!value}>Clear</Button>
        <Button variant="ghost" size="sm" onClick={() => onSelect(today)}>Today</Button>
      </div>
    </div>
  );
}
