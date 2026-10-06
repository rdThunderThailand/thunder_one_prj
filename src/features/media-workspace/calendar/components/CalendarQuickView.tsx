import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { CONTENT_KIND_LABELS, ContentKindIcon } from "../../publications/components/now-next/ContentKindIcon";
import { ProgramCover } from "../../publications/components/now-next/ProgramCover";
import { PRIORITY_STYLES } from "../../publications/components/now-next/UpNextTimeline";
import { contentHref } from "../../publications/now-next-view";
import type { CalendarPublication, CalendarRow, CalendarSegment } from "../calendar-api";
import { clockLabel, formatDuration, isNowBlock, nextBlock, partOf, programAction } from "../calendar-day";

const OUTPUT_KIND_LABELS = { screen: "Screen", tv: "TV", kiosk: "Kiosk" } as const;

function ContentLine({ publication }: { publication: CalendarPublication }) {
  const { content } = publication;
  const href = contentHref(content);
  const name = content.name ?? publication.content_name ?? CONTENT_KIND_LABELS[content.kind];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ContentKindIcon
        kind={content.kind}
        className="h-4 w-4 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Content · {CONTENT_KIND_LABELS[content.kind]}</p>
        {href ? (
          <Link
            href={href}
            className="block truncate text-sm font-medium text-foreground hover:text-primary"
          >
            {name}
          </Link>
        ) : (
          <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        )}
      </div>
    </div>
  );
}

function ProgramLine({ publication, returnTo, now }: { publication: CalendarPublication; returnTo: string; now: number }) {
  const action = programAction(publication, returnTo, now);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProgramCover
        publication={publication}
        className="h-12 w-20"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/media-workspace/program/${publication.id}`}
          className="block truncate font-semibold text-foreground hover:text-primary"
        >
          {publication.name}
        </Link>
        <ContentLine publication={publication} />
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
      >
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}

/** Docked under the grid (ADR 0085 §9). `date` is the displayed day, for "24:00" at its closing midnight. */
export function CalendarQuickView({ row, segment, date, now, returnTo }: { row: CalendarRow; segment: CalendarSegment; date: string; now: number; returnTo: string }) {
  const { channel } = row;
  const priority = PRIORITY_STYLES[segment.priority];
  const wider = partOf(segment);
  const next = nextBlock(row, segment);
  const [nextProgram] = next?.publications ?? [];
  const where = channel
    ? [channel.name, channel.location_name, OUTPUT_KIND_LABELS[channel.output_kind], channel.expected_resolution].filter(Boolean).join(" · ")
    : `${row.device?.name ?? "Media Device"} · Direct Media Device`;
  return (
    <section
      aria-label="Program details"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-panel lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isNowBlock(segment, now) && <Badge variant="success">Now</Badge>}
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${priority.block}`}>{priority.label} priority</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {clockLabel(segment.opens_at, date)} – {clockLabel(segment.closes_at, date)}
          </span>
          <span className="text-xs text-muted-foreground">({formatDuration(Date.parse(segment.closes_at) - Date.parse(segment.opens_at))})</span>
        </div>
        <p className="text-xs text-muted-foreground">{where}</p>
        {segment.publications.map((publication) => (
          <ProgramLine
            key={publication.id}
            publication={publication}
            returnTo={returnTo}
            now={now}
          />
        ))}
        {wider && (
          <p className="text-xs text-muted-foreground">
            Part of {clockLabel(wider.opens_at, date)}–{wider.closes_at ? clockLabel(wider.closes_at, date) : "open end"}
          </p>
        )}
        {segment.suppressed.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Also scheduled (hidden): {segment.suppressed.map((item) => `${item.name} · ${item.priority}`).join(", ")}
          </p>
        )}
      </div>
      <div className="lg:w-64 lg:border-l lg:border-border lg:pl-4">
        <p className="mb-2 text-xs text-muted-foreground">Next Program</p>
        {next && nextProgram ? (
          <div className="flex min-w-0 items-center gap-2">
            <ProgramCover publication={nextProgram} />
            <div className="min-w-0">
              <Link
                href={`/media-workspace/program/${nextProgram.id}`}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {nextProgram.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                Starts {clockLabel(next.opens_at, date)} ({formatDuration(Date.parse(next.closes_at) - Date.parse(next.opens_at))})
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing else today</p>
        )}
      </div>
    </section>
  );
}
