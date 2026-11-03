import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { useRegistrationSelector } from "../../hooks/use-registration-selector";
import { referenceLabel, type ReferenceItem, type SelectorKind } from "../../services/registration-selector-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationField } from "./RegistrationFields";
import { RegistrationSelectorStatus } from "./RegistrationSelectorStatus";

export function RegistrationReferenceSelect({ name, label, value, selectedLabel, kind, context, rules, onChange, error }: {
  name: string; label: string; value: string; selectedLabel: string; kind: SelectorKind; context: string;
  rules: RegistrationOptions["referenceSelectors"]; onChange: (item: ReferenceItem) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const selector = useRegistrationSelector(context, kind, rules, open);
  function choose(item: ReferenceItem) { onChange(item); setOpen(false); }
  return (
    <RegistrationField name={name} label={label} required error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={`registration-${name}`} variant="outline" className="h-10 w-full justify-between font-normal"
            aria-label={label} aria-invalid={Boolean(error)} title={`${selectedLabel} ${value}`} aria-describedby={error ? `registration-${name}-error` : undefined}>
            <span className="min-w-0 truncate">{selectedLabel || `Select ${label.toLowerCase()}`}</span>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={`Choose ${label}`} className="max-h-[70dvh] w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] space-y-2 overflow-y-auto p-2"
          onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}>
          <Input ref={input} type="search" aria-label={`Search ${label}`} placeholder={`Search all ${label.toLowerCase()}…`} autoComplete="off"
            maxLength={rules.search.maxLength} value={selector.search} onChange={(event) => selector.setSearch(event.target.value)} aria-controls={id} />
          {kind !== "persons" && selector.trail.length > 0 && !selector.search.trim() && (
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selector.root}>All references</Button>
                <Button variant="outline" size="sm" onClick={selector.back}>Back</Button>
              </div>
              <p className="break-words">{selector.trail.map((item) => item.name).join(" › ")}</p>
              <Button variant="outline" size="sm" onClick={() => choose(selector.trail.at(-1)!)}>Select this parent</Button>
            </div>
          )}
          <ul id={id} className="space-y-1" aria-label={label}>
            {selector.items.map((item) => (
              <li key={item.id} className="flex min-w-0 items-start gap-1">
                <Button variant="ghost" className="h-auto min-h-8 min-w-0 flex-1 justify-start whitespace-normal px-2 text-left text-xs"
                  title={item.id} aria-description={`ID ${item.id}`} onClick={() => choose(item)}>
                  <span className="min-w-0 flex-1 break-words">
                    {referenceLabel(item, kind)}
                    {item.code && <span className="block text-muted-foreground">{item.code}</span>}
                  </span>
                  {value === item.id && <CheckIcon className="h-4 w-4 shrink-0 text-primary" />}
                </Button>
                {kind !== "persons" && <Button variant="outline" size="sm" aria-label={`Browse children of ${item.name}`} onClick={() => selector.browse(item)}>Browse</Button>}
              </li>
            ))}
          </ul>
          <RegistrationSelectorStatus selector={selector} people={kind === "persons"} />
        </PopoverContent>
      </Popover>
    </RegistrationField>
  );
}
