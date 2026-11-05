import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { CalendarIcon } from "@/components/ui/icons";
import { isCalendarDate } from "../../domain/registration-warranty-dates";
import { RegistrationCalendar } from "./RegistrationCalendar";
import { RegistrationField } from "./RegistrationFields";

function displayDate(value: string): string {
  return isCalendarDate(value) ? `${value.slice(8)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : value;
}

function inputDate(value: string): string {
  const formatted = /^\d{8}$/.test(value) ? `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}` : value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
  if (!match) return value;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return isCalendarDate(iso) ? iso : value;
}

function todayInBangkok(): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function RegistrationDateField({ name, label, value, onChange, readOnly, error, hint }: {
  name: string; label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; error?: string; hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <RegistrationField name={name} label={label} error={error} hint={hint}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              id={`registration-${name}`}
              value={displayDate(value)}
              placeholder="dd/mm/yyyy"
              inputMode="numeric"
              readOnly={readOnly}
              maxLength={10}
              className="pr-12 max-sm:h-10"
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `registration-${name}-error` : hint ? `registration-${name}-hint` : undefined}
              onChange={(event) => onChange?.(inputDate(event.target.value))}
            />
            {readOnly ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <CalendarIcon aria-hidden="true" className="h-4 w-4" />
              </span>
            ) : (
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Open ${label} calendar`}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 text-accent-foreground max-sm:size-9"
                >
                  <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            )}
          </div>
        </PopoverAnchor>
        {!readOnly && (
          <PopoverContent
            align="start"
            collisionPadding={12}
            aria-label={`${label} calendar`}
            className="max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-control p-3 motion-reduce:animate-none"
          >
            <RegistrationCalendar
              key={`${open}:${value}`}
              value={value}
              today={todayInBangkok()}
              onSelect={(date) => {
                onChange?.(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        )}
      </Popover>
    </RegistrationField>
  );
}
