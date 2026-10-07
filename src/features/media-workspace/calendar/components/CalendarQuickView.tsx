import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { CONTENT_KIND_LABELS, ContentKindIcon } from "../../publications/components/now-next/ContentKindIcon";
import { ProgramCover } from "../../publications/components/now-next/ProgramCover";
import { PRIORITY_STYLES } from "../../publications/components/now-next/UpNextTimeline";
import { contentHref } from "../../publications/now-next-view";
import type { CalendarPublication, CalendarRow, CalendarSegment } from "../calendar-api";
import { clockLabel, formatDuration, isNowBlock, nextBlock, partOf, programAction } from "../calendar-day";

function ContentLine({ publication }: { publication: CalendarPublication }) {
  const { content } = publication;
  const href = contentHref(content);
  const name = content.name ?? publication.content_name ?? CONTENT_KIND_LABELS[content.kind];
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-foreground">
      <ContentKindIcon
        kind={content.kind}
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
      />
      <span className="shrink-0 text-muted-foreground">{CONTENT_KIND_LABELS[content.kind]} ·</span>
      {href ? (
        <Link
          href={href}
          className="truncate hover:text-primary"
        >
          {name}
        </Link>
      ) : (
        <span className="truncate">{name}</span>
      )}
    </div>
  );
}

function EditButton({ publication, returnTo, now }: { publication: CalendarPublication; returnTo: string; now: number }) {
  const action = programAction(publication, returnTo, now);
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
    >
      <Link href={action.href}>{action.label}</Link>
    </Button>
  );
}

/** Docked under the grid (ADR 0085 §9), laid out as the frame draws it: cover · details · Edit · Next Program. `date` is the displayed day, for "24:00" at its closing midnight. */
export function CalendarQuickView({ row, segment, date, now, returnTo }: { row: CalendarRow; segment: CalendarSegment; date: string; now: number; returnTo: string }) {
  const { channel } = row;
  const [first, ...others] = segment.publications;
  const priority = PRIORITY_STYLES[segment.priority];
  const wider = partOf(segment);
  const next = nextBlock(row, segment);
  const [nextProgram] = next?.publications ?? [];
  const isLoop = others.length > 0;
  return (
    <section
      aria-label="Program details"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-panel lg:flex-row lg:items-center"
    >
      <ProgramCover
        publication={first}
        className="h-20 w-32"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {isNowBlock(segment, now) && <Badge variant="success">Now</Badge>}
          <Link
            href={`/media-workspace/program/${first.id}`}
            className="truncate text-sm font-bold text-foreground hover:text-primary"
          >
            {first.name}
            {isLoop && <span className="font-normal text-muted-foreground"> +{others.length} in loop</span>}
          </Link>
        </div>
        <p className="text-[11px] tabular-nums text-foreground">
          {clockLabel(segment.opens_at, date)} – {clockLabel(segment.closes_at, date)}
          <span className="text-muted-foreground"> ({formatDuration(Date.parse(segment.closes_at) - Date.parse(segment.opens_at))})</span>
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {channel ? (
            <Link
              href={`/media-workspace/channels?channel=${channel.id}`}
              className="hover:text-primary"
            >
              {channel.name}
            </Link>
          ) : (
            (row.device?.name ?? "Media Device")
          )}
          {channel?.location_name && ` · ${channel.location_name}`}
        </p>
      </div>
      <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[10px] lg:w-72">
        <dt className="text-muted-foreground">Priority</dt>
        <dd>
          <span className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${priority.block}`}>{priority.label}</span>
        </dd>
        {isLoop ? (
          <>
            <dt className="text-muted-foreground">Loop</dt>
            <dd className="flex min-w-0 flex-col gap-1">
              {segment.publications.map((publication) => {
                const action = programAction(publication, returnTo, now);
                return (
                  <span
                    key={publication.id}
                    className="flex min-w-0 items-center gap-2"
                  >
                    <Link
                      href={`/media-workspace/program/${publication.id}`}
                      className="truncate font-semibold text-foreground hover:text-primary"
                    >
                      {publication.name}
                    </Link>
                    <Link
                      href={action.href}
                      className="shrink-0 text-primary hover:underline"
                    >
                      {action.label}
                    </Link>
                  </span>
                );
              })}
            </dd>
          </>
        ) : (
          <>
            <dt className="text-muted-foreground">Content</dt>
            <dd className="min-w-0">
              <ContentLine publication={first} />
            </dd>
          </>
        )}
        {wider && (
          <>
            <dt className="text-muted-foreground">Part of</dt>
            <dd className="text-foreground">
              {clockLabel(wider.opens_at, date)}–{wider.closes_at ? clockLabel(wider.closes_at, date) : "open end"}
            </dd>
          </>
        )}
        {segment.suppressed.length > 0 && (
          <>
            <dt className="text-muted-foreground">Overridden</dt>
            <dd
              className="truncate text-foreground"
              title={segment.suppressed.map((item) => item.name).join(", ")}
            >
              {segment.suppressed[0].name}
              {segment.suppressed.length > 1 && ` +${segment.suppressed.length - 1} more`}
            </dd>
          </>
        )}
      </dl>
      {!isLoop && (
        <EditButton
          publication={first}
          returnTo={returnTo}
          now={now}
        />
      )}
      <div className="lg:w-60 lg:border-l lg:border-border lg:pl-4">
        <p className="mb-2 text-[9px] text-muted-foreground">Next Program</p>
        {next && nextProgram ? (
          <div className="flex min-w-0 items-center gap-2">
            <ProgramCover publication={nextProgram} />
            <div className="min-w-0">
              <Link
                href={`/media-workspace/program/${nextProgram.id}`}
                className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
              >
                {nextProgram.name}
              </Link>
              <p className="text-[9px] text-muted-foreground">Starts {clockLabel(next.opens_at, date)}</p>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Nothing else today</p>
        )}
      </div>
    </section>
  );
}
