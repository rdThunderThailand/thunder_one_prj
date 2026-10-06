import Link from "next/link";
import { blockPosition, clockLabel, type OverriddenLane } from "../calendar-day";

const HOURS = Array.from({ length: 23 }, (_, index) => index + 1);
// Muted diagonal hatching from the current text colour, so it follows the theme tokens.
const HATCH = "repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, currentColor 22%, transparent) 5px 7px)";

/** Hour lines and the now line behind every lane. */
export function LaneGuides({ nowLeft }: { nowLeft: number | null }) {
  return (
    <>
      {HOURS.map((hour) => (
        <span
          key={hour}
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: `${(hour / 24) * 100}%` }}
        />
      ))}
      {nowLeft !== null && (
        <span
          className="absolute inset-y-0 z-10 w-px bg-primary"
          style={{ left: `${nowLeft}%` }}
        />
      )}
    </>
  );
}

/** ADR 0085 Rev.2 §10: under an expanded row, where each overridden Program was scheduled but not playing. */
export function OverriddenLanes({ lanes, date, laneWidth, nowLeft }: { lanes: OverriddenLane[]; date: string; laneWidth: number; nowLeft: number | null }) {
  return lanes.map((lane) => (
    <div
      key={lane.id}
      className="flex border-t border-dashed border-border"
    >
      <div className="sticky left-0 z-20 flex h-8 w-[200px] shrink-0 items-center border-r border-border bg-card pl-12 pr-3">
        <span
          className="truncate text-[11px] text-muted-foreground"
          title={`${lane.name} · ${lane.priority}`}
        >
          {lane.name}
        </span>
      </div>
      <div
        className="relative h-8"
        style={{ width: laneWidth }}
      >
        <LaneGuides nowLeft={nowLeft} />
        {lane.spans.map((span) => {
          const position = blockPosition(span, date);
          const range = `${clockLabel(span.opens_at, date)}–${clockLabel(span.closes_at, date)}`;
          return (
            <Link
              key={span.opens_at}
              href={`/media-workspace/program/${lane.id}`}
              title={`${lane.name} · ${range} · Overridden by ${span.winners.join(", ")}`}
              aria-label={`${lane.name}, ${range}, overridden by ${span.winners.join(", ")}`}
              className="absolute top-1 flex h-6 items-center overflow-clip rounded border border-dashed border-border px-1.5 text-[10px] text-muted-foreground outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
              style={{ left: `${position.left}%`, width: `${position.width}%`, backgroundImage: HATCH }}
            >
              <span className="sticky left-[208px] truncate">Overridden · {range}</span>
            </Link>
          );
        })}
      </div>
    </div>
  ));
}
