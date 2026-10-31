import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
import type { RegistrationReferenceChoice } from "../../domain/registration-reference-choices";
import { RegistrationField } from "./RegistrationFields";

export function RegistrationReferenceSelect({ name, label, value, items, onChange, required, error, hint, emptyMessage }: {
  name: string; label: string; value: string; items: RegistrationReferenceChoice[];
  onChange: (value: string) => void; required?: boolean; error?: string; hint?: string; emptyMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = items.find((item) => item.value === value);
  const matches = items.filter((item) => item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const active = Math.min(activeIndex, matches.length - 1);

  function changeOpen(next: boolean) {
    if (next) restoreTriggerFocus.current = false;
    setOpen(next);
    setQuery("");
    setActiveIndex(Math.max(0, items.findIndex((item) => item.value === value)));
  }

  function choose(next: string) {
    onChange(next);
    restoreTriggerFocus.current = true;
    changeOpen(false);
  }

  useEffect(() => {
    const container = list.current;
    const option = container?.children.item(active);
    if (!container || !(option instanceof HTMLElement)) return;
    const bounds = container.getBoundingClientRect();
    const row = option.getBoundingClientRect();
    if (row.top < bounds.top) container.scrollTop += row.top - bounds.top;
    else if (row.bottom > bounds.bottom) container.scrollTop += row.bottom - bounds.bottom;
  }, [active, query, open]);

  return (
    <RegistrationField name={name} label={label} required={required} error={error} hint={hint}>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={trigger} id={`registration-${name}`} variant="outline" className="h-10 w-full justify-between font-normal"
            aria-label={label} aria-invalid={Boolean(error)}
            title={selected?.label}
            aria-describedby={[`${listId}-selection`, error ? `registration-${name}-error` : "", hint ? `registration-${name}-hint` : ""].filter(Boolean).join(" ")}
          >
            <span id={`${listId}-selection`} className="min-w-0 truncate">{selected?.label || (value ? "Previous selection unavailable" : `Select ${label.toLowerCase()}`)}</span>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start" aria-label={`Choose ${label}`} className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-2"
          onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}
          onEscapeKeyDown={() => { restoreTriggerFocus.current = true; }}
          onCloseAutoFocus={(event) => {
            if (!restoreTriggerFocus.current) return;
            event.preventDefault();
            trigger.current?.focus({ preventScroll: true });
            restoreTriggerFocus.current = false;
          }}
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={input} role="combobox" aria-label={`Search ${label}`} aria-expanded={open} aria-required={required}
              aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              placeholder={`Search ${label.toLowerCase()}…`} className="pl-9" autoComplete="off" value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const direction = event.key === "ArrowDown" ? 1 : -1;
                  setActiveIndex(Math.max(0, Math.min(matches.length - 1, active + direction)));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  if (matches[active]) choose(matches[active].value);
                }
              }}
            />
          </div>
          <div ref={list} id={listId} role="listbox" aria-label={label} className="mt-2 max-h-56 overflow-y-auto overscroll-contain">
            {matches.map((item, index) => (
              <div
                key={item.value} id={`${listId}-${index}`} role="option" aria-selected={value === item.value}
                className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-xs ${active === index ? "bg-muted" : "hover:bg-muted"}`}
                onMouseDown={(event) => event.preventDefault()} onMouseMove={() => setActiveIndex(index)} onClick={() => choose(item.value)}
              >
                <span className="min-w-0 flex-1 break-words">{item.label}</span>
                {value === item.value && <CheckIcon className="h-4 w-4 text-primary" />}
              </div>
            ))}
          </div>
          {matches.length === 0 && <p role="status" className="p-3 text-xs text-muted-foreground">{items.length ? "No matching results. Try another search." : emptyMessage}</p>}
        </PopoverContent>
      </Popover>
    </RegistrationField>
  );
}
