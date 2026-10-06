import Link from "next/link";
import { MonitorIcon } from "@/components/ui/icons";
import type { NowNextOccurrence, NowNextPriority, NowNextRow } from "../../now-next";
import { formatClock } from "../../now-next-view";
import { timelinePosition, timelineTicks, timelineWindow } from "../../now-next-layout";

const HORIZON = 180;

// ADR 0084 §8: block colour follows Publication Priority, from the status tokens.
export const PRIORITY_STYLES: Record<NowNextPriority, { label: string; block: string; dot: string }> = {
  urgent: { label: "Urgent", block: "border-danger/30 bg-danger-soft text-danger", dot: "bg-danger" },
  high: { label: "High", block: "border-warning/30 bg-warning-soft text-warning", dot: "bg-warning" },
  normal: { label: "Normal", block: "border-primary/30 bg-primary-soft text-primary", dot: "bg-primary" },
  low: { label: "Low", block: "border-success/30 bg-success-soft text-success", dot: "bg-success" },
};

function Block({ occurrence, asOf, timeZone }: { occurrence: NowNextOccurrence; asOf: string; timeZone: string }) {
  const position = timelinePosition(occurrence.opens_at, occurrence.closes_at, asOf, HORIZON);
  const [first] = occurrence.publications;
  const range = `${formatClock(occurrence.opens_at, timeZone)}–${formatClock(occurrence.closes_at, timeZone)}`;
  const label = `${first?.name ?? "Program"} · ${range}`;
  return (
    <Link
      href={first ? `/media-workspace/program/${first.id}` : "/media-workspace/program"}
      title={label}
      aria-label={`View ${label}`}
      className={`absolute top-1.5 h-[46px] overflow-hidden rounded-md border px-2 py-1 outline-none transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring/30 ${PRIORITY_STYLES[occurrence.priority].block}`}
      style={{ left: `${position.left}%`, width: `${position.width}%` }}
    >
      <div className="truncate text-[11px] font-semibold">{first?.name ?? "Program"}</div>
      <div className="truncate text-[9px] opacity-75">{range}</div>
    </Link>
  );
}

export function UpNextTimeline({ rows, asOf, timeZone }: { rows: NowNextRow[]; asOf: string; timeZone: string }) {
  const ticks = timelineTicks(asOf, HORIZON);
  const { current, start, end } = timelineWindow(asOf, HORIZON);
  const nowLeft = ((current - start) / (end - start)) * 100;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">Up Next</h2>
          <p className="text-[9px] text-muted-foreground">Next 3 hours · effective schedule by Channel</p>
        </div>
        <ul className="flex gap-4 text-[9px] text-muted-foreground">
          {Object.values(PRIORITY_STYLES).map((style) => (
            <li
              key={style.label}
              className="flex items-center gap-1.5"
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {style.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[220px_minmax(0,1fr)]">
          <div className="border-r border-border px-4 py-3 text-[9px] font-bold text-muted-foreground">Channel</div>
          <div className="relative h-11 border-b border-border">
            {ticks.map((tick, index) => (
              <span
                key={tick}
                className={`absolute top-6 text-[9px] font-medium text-muted-foreground ${index === 0 ? "" : index === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${(index / (ticks.length - 1)) * 100}%` }}
              >
                {formatClock(tick, timeZone)}
              </span>
            ))}
            <span
              className="absolute top-0 -translate-x-1/2 rounded-b bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
              style={{ left: `${nowLeft}%` }}
            >
              Now
            </span>
          </div>
          {rows.map((row) => {
            const occurrences = [row.current, ...row.upcoming].filter((item): item is NowNextOccurrence => Boolean(item));
            const name = row.channel?.name ?? row.device?.name ?? "Media Device";
            return (
              <div
                key={`${row.row_type}-${row.channel?.id ?? row.device?.id}`}
                className="contents"
              >
                <div className="flex min-w-0 items-center gap-2 border-r border-t border-border px-4 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <MonitorIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold text-foreground">{name}</div>
                    <div className="truncate text-[9px] text-muted-foreground">{row.channel?.location_name ?? (row.channel ? "" : "Direct Media Device")}</div>
                  </div>
                </div>
                <div className="relative h-[58px] border-t border-border">
                  {[25, 50, 75].map((percent) => (
                    <span
                      key={percent}
                      className="absolute inset-y-0 w-px bg-border"
                      style={{ left: `${percent}%` }}
                    />
                  ))}
                  <span
                    className="absolute inset-y-0 z-10 w-px bg-primary/40"
                    style={{ left: `${nowLeft}%` }}
                  />
                  {occurrences.map((occurrence) => (
                    <Block
                      key={occurrence.occurrence_id}
                      occurrence={occurrence}
                      asOf={asOf}
                      timeZone={timeZone}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
