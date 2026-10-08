"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { SearchInput } from "@/components/ui/lovable/core";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ChannelScopePicker } from "../../channels/components/ChannelScopePicker";
import type { ChannelScope } from "../../channels/channel-scope";
import { fetchPublications } from "../../publications/services/publications-api";
import type { ProgramFilter } from "../playback-proof-api";
import { isValidCustomRange, MAX_RANGE_DAYS, RANGE_PRESETS, rangeDays, type DateRange, type RangePreset } from "../playback-proof-url";

const PRESET_LABELS: Record<RangePreset, string> = { today: "Today", yesterday: "Yesterday", "7d": "Last 7 days", "30d": "Last 30 days" };
const CUSTOM = "custom";
const ALL = "all";
const UNATTRIBUTED = "unattributed";

function RangePicker({ range, today, onChange }: { range: DateRange; today: string; onChange: (range: DateRange) => void }) {
  const [draft, setDraft] = useState(() => rangeDays(range, today));
  const [isCustom, setIsCustom] = useState(range.kind === "custom");
  const isValid = isValidCustomRange(draft.from, draft.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={isCustom ? CUSTOM : range.kind === "preset" ? range.preset : CUSTOM}
        onValueChange={(value) => {
          if (value === CUSTOM) {
            setDraft(rangeDays(range, today));
            setIsCustom(true);
            return;
          }
          setIsCustom(false);
          onChange({ kind: "preset", preset: value as RangePreset });
        }}
      >
        <SelectTrigger
          className="h-9 w-40"
          aria-label="Date range"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_PRESETS.map((preset) => (
            <SelectItem
              key={preset}
              value={preset}
            >
              {PRESET_LABELS[preset]}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Custom range</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <>
          <Input
            type="date"
            aria-label="From"
            className="h-9 w-36"
            value={draft.from}
            max={today}
            onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="To"
            className="h-9 w-36"
            value={draft.to}
            max={today}
            onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
          />
          <Button
            size="sm"
            disabled={!isValid}
            title={isValid ? undefined : `Pick a start on or before the end, at most ${MAX_RANGE_DAYS} days`}
            onClick={() => onChange({ kind: "custom", from: draft.from, to: draft.to })}
          >
            Apply
          </Button>
        </>
      )}
    </div>
  );
}

function ProgramPicker({ value, onChange }: { value: ProgramFilter; onChange: (value: ProgramFilter) => void }) {
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let alive = true;
    fetchPublications()
      // A Draft never aired, so it can have no proof.
      .then((rows) => alive && setPrograms(rows.filter((row) => row.status !== "draft").map((row) => ({ id: row.id, name: row.name }))))
      // A failed list only leaves "All" and "Unattributed"; the report still works.
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const selected = value.kind === "program" ? value.id : value.kind;
  return (
    <Select
      value={selected}
      onValueChange={(next) =>
        onChange(next === ALL ? { kind: "all" } : next === UNATTRIBUTED ? { kind: "unattributed" } : { kind: "program", id: next })
      }
    >
      <SelectTrigger
        className="h-9 w-48"
        aria-label="Program"
      >
        <SelectValue placeholder="All Programs" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All Programs</SelectItem>
        <SelectItem value={UNATTRIBUTED}>Unattributed</SelectItem>
        {programs.map((program) => (
          <SelectItem
            key={program.id}
            value={program.id}
          >
            {program.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PlaybackProofToolbar({
  range,
  today,
  scope,
  program,
  search,
  onRange,
  onScope,
  onProgram,
  onSearch,
  onExport,
  isExporting,
}: {
  range: DateRange;
  today: string;
  scope: ChannelScope;
  program: ProgramFilter;
  search: string;
  onRange: (range: DateRange) => void;
  onScope: (scope: ChannelScope) => void;
  onProgram: (program: ProgramFilter) => void;
  onSearch: (search: string) => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RangePicker
        range={range}
        today={today}
        onChange={onRange}
      />
      <ChannelScopePicker
        value={scope}
        onApply={onScope}
      />
      <ProgramPicker
        value={program}
        onChange={onProgram}
      />
      <SearchInput
        className="ml-auto w-64"
        placeholder="Search media name…"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={onExport}
      >
        <Download className="size-4" />
        {isExporting ? "Exporting…" : "Export CSV"}
      </Button>
    </div>
  );
}
