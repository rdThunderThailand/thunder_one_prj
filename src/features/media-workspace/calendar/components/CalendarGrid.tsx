"use client";

import { useEffect, useRef, useState } from "react";
import { BoxIcon, ChevronDownIcon, ChevronRightIcon, MonitorIcon } from "@/components/ui/icons";
import { ProgramCover } from "../../publications/components/now-next/ProgramCover";
import { PRIORITY_STYLES } from "../../publications/components/now-next/UpNextTimeline";
import type { CalendarRow, CalendarSegment } from "../calendar-api";
import { blockPosition, clockLabel, defaultBlock, initialScrollPercent, isNowBlock, nowPercent, overriddenLanes } from "../calendar-day";
import { LaneGuides, OverriddenLanes } from "./OverriddenLanes";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const LANE_PX = 24 * 80;
const OUTPUT_KIND_LABELS = { screen: "Screen", tv: "TV", kiosk: "Kiosk" } as const;

export const rowKey = (row: CalendarRow) => `${row.row_type}-${row.channel?.id ?? row.device?.id}`;
export const blockKey = (row: CalendarRow, segment: CalendarSegment) => `${rowKey(row)}|${segment.opens_at}`;

function RowHeader({
  row,
  selected,
  onSelect,
  expanded,
  onToggle,
}: {
  row: CalendarRow;
  selected: boolean;
  onSelect: () => void;
  expanded: boolean | null;
  onToggle: () => void;
}) {
  const { channel, device } = row;
  const Icon = channel?.output_kind === "kiosk" ? BoxIcon : MonitorIcon;
  const name = channel?.name ?? device?.name ?? "Media Device";
  const detail = channel
    ? [OUTPUT_KIND_LABELS[channel.output_kind], channel.location_name].filter(Boolean).join(" · ")
    : "Direct Media Device";
  const content = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-foreground">{name}</span>
        <p className="truncate text-[9px] text-muted-foreground">{detail}</p>
      </div>
    </>
  );
  return (
    <div className={`sticky left-0 z-20 flex h-[58px] w-[200px] shrink-0 items-center border-r border-border ${selected ? "bg-muted" : "bg-card"}`}>
      <span className="flex w-6 shrink-0 justify-center">
        {/* ▸ only when the row overrides something (ADR 0085 Rev.2 §10). */}
        {expanded !== null && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} overridden Programs for ${name}`}
            onClick={onToggle}
            className="rounded p-0.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {expanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
          </button>
        )}
      </span>
      {/* A lane with no blocks has nothing to show in Quick View, so its header is plain. */}
      {row.segments.length === 0 ? (
        <div className="flex h-full min-w-0 flex-1 items-center gap-2 pr-3">{content}</div>
      ) : (
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`Show details for ${name}`}
          onClick={onSelect}
          className="flex h-full min-w-0 flex-1 items-center gap-2 pr-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {content}
        </button>
      )}
    </div>
  );
}

function Block({ segment, date, now, selected, onSelect }: { segment: CalendarSegment; date: string; now: number; selected: boolean; onSelect: () => void }) {
  const position = blockPosition(segment, date);
  const [first] = segment.publications;
  const isLoop = segment.publications.length > 1;
  const name = isLoop ? `${first.name} +${segment.publications.length - 1}` : first.name;
  const range = `${clockLabel(segment.opens_at, date)}–${clockLabel(segment.closes_at, date)}`;
  const hidden = segment.suppressed.length;
  return (
    <button
      type="button"
      title={`${name} · ${range}`}
      aria-label={`${name}, ${range}`}
      aria-pressed={selected}
      onClick={onSelect}
      className={`absolute top-1.5 h-[46px] overflow-clip rounded-md border px-2 py-1 text-left outline-none transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring/30 ${PRIORITY_STYLES[segment.priority].block} ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ left: `${position.left}%`, width: `${position.width}%` }}
    >
      {/* Sticky so the label stays in view when a long block starts left of the scrolled grid. */}
      <div className="sticky left-[208px] flex w-max max-w-full items-center gap-2">
        {/* Frame: the Program's cover leads the block; ProgramCover falls back to the content-kind icon. */}
        <ProgramCover
          publication={first}
          className="h-8 w-8"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            <span className="truncate">{name}</span>
            {isNowBlock(segment, now) && (
              <span className="shrink-0 rounded bg-primary px-1 text-[9px] font-semibold text-primary-foreground">Now</span>
            )}
          </div>
          <div className="truncate text-[9px] opacity-75">
            {range}
            {hidden > 0 && ` · +${hidden} overridden`}
          </div>
        </div>
      </div>
    </button>
  );
}

/** Day grid (ADR 0085 §8): one lane per row, 00:00–24:00, scrolls horizontally. */
export function CalendarGrid({
  rows,
  date,
  now,
  selectedKey,
  onSelect,
}: {
  rows: CalendarRow[];
  date: string;
  now: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const nowLeft = nowPercent(date, now);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (initialScrollPercent(date, Date.now()) / 100) * LANE_PX;
  }, [date]);

  return (
    <div
      ref={scroller}
      className="overflow-x-auto"
    >
      <div style={{ width: 200 + LANE_PX }}>
        <div className="flex border-b border-border">
          <div className="sticky left-0 z-20 w-[200px] shrink-0 border-r border-border bg-card px-3 py-3 text-[9px] font-bold text-muted-foreground">
            GMT+7
          </div>
          <div
            className="relative h-10"
            style={{ width: LANE_PX }}
          >
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="absolute top-3 pl-1.5 text-[9px] font-medium text-muted-foreground"
                style={{ left: `${(hour / 24) * 100}%` }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
            {nowLeft !== null && (
              <span
                className="absolute top-0 z-10 -translate-x-1/2 rounded-b bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
                style={{ left: `${nowLeft}%` }}
              >
                Now
              </span>
            )}
          </div>
        </div>
        {rows.map((row) => {
          const key = rowKey(row);
          const lanes = overriddenLanes(row);
          const isExpanded = expanded.has(key);
          return (
            <div
              key={key}
              className="border-t border-border first:border-t-0"
            >
              <div className="flex">
                <RowHeader
                  row={row}
                  selected={row.segments.some((segment) => blockKey(row, segment) === selectedKey)}
                  onSelect={() => {
                    const target = defaultBlock(row, now);
                    if (target) onSelect(blockKey(row, target));
                  }}
                  expanded={lanes.length > 0 ? isExpanded : null}
                  onToggle={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (!next.delete(key)) next.add(key);
                      return next;
                    })
                  }
                />
                <div
                  className="relative h-[58px]"
                  style={{ width: LANE_PX }}
                >
                  <LaneGuides nowLeft={nowLeft} />
                  {row.segments.map((segment) => (
                    <Block
                      key={segment.opens_at}
                      segment={segment}
                      date={date}
                      now={now}
                      selected={blockKey(row, segment) === selectedKey}
                      onSelect={() => onSelect(blockKey(row, segment))}
                    />
                  ))}
                </div>
              </div>
              {isExpanded && (
                <OverriddenLanes
                  lanes={lanes}
                  date={date}
                  laneWidth={LANE_PX}
                  nowLeft={nowLeft}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
