import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useRegistrationSelector } from "../../hooks/use-registration-selector";
import { referenceLabel, type ReferenceItem, type SelectorKind } from "../../services/registration-selector-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationField } from "./RegistrationFields";
import { RegistrationSelectorStatus } from "./RegistrationSelectorStatus";
import { cn } from "@/lib/utils";

export function RegistrationReferenceSelect({ name, label, value, selectedLabel, kind, context, rules, onChange, error }: {
  name: string; label: string; value: string; selectedLabel: string; kind: SelectorKind; context: string;
  rules: RegistrationOptions["referenceSelectors"]; onChange: (item: ReferenceItem) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const selector = useRegistrationSelector(context, kind, rules, open);
  const parent = selector.trail.at(-1);
  const collection = kind === "persons" ? "people" : kind === "orgUnits" ? "organizational units" : kind;

  function choose(item: ReferenceItem) {
    onChange(item);
    setOpen(false);
  }

  return (
    <RegistrationField name={name} label={label} required error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`registration-${name}`}
            variant="outline"
            className="h-auto min-h-10 w-full items-start justify-between gap-3 py-2 text-start font-normal"
            aria-label={`${label} (required): ${selectedLabel || "Not selected"}`}
            aria-invalid={Boolean(error)}
            title={selectedLabel || undefined}
            aria-describedby={error ? `registration-${name}-error` : undefined}
          >
            <span className="min-w-0 flex-1 whitespace-normal break-words leading-relaxed">
              {selectedLabel || `Select ${label.toLowerCase()}`}
            </span>
            <ChevronDownIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={12}
          aria-label={`Choose ${label}`}
          className="flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] flex-col gap-3 overflow-hidden rounded-control p-3 motion-reduce:animate-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <Input
            ref={input}
            type="search"
            aria-label={`Search ${collection}`}
            placeholder={`Search all ${collection}…`}
            autoComplete="off"
            className="shrink-0 max-sm:h-10"
            maxLength={rules.search.maxLength}
            value={selector.search}
            onChange={(event) => selector.setSearch(event.target.value)}
            aria-controls={id}
          />
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain">
            {kind !== "persons" && parent && !selector.search.trim() && (
              <div className="space-y-2 border-b border-border pb-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.root}>
                    All {collection}
                  </Button>
                  <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.back}>
                    <ArrowLeftIcon aria-hidden="true" className="size-4" />
                    Back
                  </Button>
                </div>
                <p className="break-words leading-relaxed text-muted-foreground">
                  {selector.trail.map((item) => item.name || item.code || "Unnamed reference").join(" › ")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-accent-foreground max-sm:h-10"
                  onClick={() => choose(parent)}
                >
                  Select this parent
                </Button>
              </div>
            )}
            <ul id={id} className="space-y-2" aria-label={label}>
              {selector.items.map((item) => (
                <ReferenceChoice
                  key={item.id}
                  item={item}
                  kind={kind}
                  selected={value === item.id}
                  onChoose={() => choose(item)}
                  onBrowse={kind !== "persons" ? () => selector.browse(item) : undefined}
                />
              ))}
            </ul>
            <RegistrationSelectorStatus selector={selector} people={kind === "persons"} />
          </div>
        </PopoverContent>
      </Popover>
    </RegistrationField>
  );
}

function ReferenceChoice({ item, kind, selected, onChoose, onBrowse }: {
  item: ReferenceItem;
  kind: SelectorKind;
  selected: boolean;
  onChoose: () => void;
  onBrowse?: () => void;
}) {
  return (
    <li className={cn("flex min-w-0 items-stretch gap-2 rounded-control", selected && "bg-accent")}>
      <Button
        variant="ghost"
        className={cn(
          "h-auto min-h-10 min-w-0 flex-1 items-start justify-start whitespace-normal px-3 py-2 text-left text-xs leading-relaxed text-foreground",
          selected && "text-accent-foreground",
        )}
        aria-current={selected ? "true" : undefined}
        onClick={onChoose}
      >
        <span className="min-w-0 flex-1 break-words">
          {referenceLabel(item, kind)}
          {item.code && <span className="mt-1 block text-muted-foreground">{item.code}</span>}
        </span>
        {selected && <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />}
      </Button>
      {onBrowse && (
        <Button
          variant="outline"
          size="sm"
          className="h-auto min-h-10 self-stretch"
          aria-label={`Browse children of ${item.name || item.code || "this reference"}`}
          onClick={onBrowse}
        >
          Browse
          <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        </Button>
      )}
    </li>
  );
}
