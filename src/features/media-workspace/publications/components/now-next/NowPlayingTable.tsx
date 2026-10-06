"use client";

import Link from "next/link";
import { BoxIcon, MonitorIcon, MoreIcon, RepeatIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { Progress } from "@/components/ui/lovable/progress";
import type { NowNextRow } from "../../now-next";
import { contentHref, editProgramHref, elapsedPercent, formatClock, formatRemaining, nextEntry, rowStatus } from "../../now-next-view";
import { CONTENT_KIND_LABELS, ContentKindIcon } from "./ContentKindIcon";
import { ProgramCover } from "./ProgramCover";

const OUTPUT_KIND_LABELS = { screen: "Screen", tv: "TV", kiosk: "Kiosk" } as const;
const EMPTY = <span className="text-muted-foreground">—</span>;

function ChannelCell({ row }: { row: NowNextRow }) {
  const { channel, device } = row;
  const Icon = channel?.output_kind === "kiosk" ? BoxIcon : MonitorIcon;
  const detail = channel
    ? [OUTPUT_KIND_LABELS[channel.output_kind], channel.location_name].filter(Boolean).join(" · ")
    : "Direct Media Device";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        {channel ? (
          <Link
            href={`/media-workspace/channels?channel=${channel.id}`}
            className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
          >
            {channel.name}
          </Link>
        ) : (
          <span className="block truncate text-[11px] font-semibold text-foreground">{device?.name ?? "Media Device"}</span>
        )}
        <p className="truncate text-[9px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ProgramCell({ row }: { row: NowNextRow }) {
  const publications = row.current?.publications ?? [];
  const [first] = publications;
  if (!first) return EMPTY;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ProgramCover publication={first} />
      <div className="min-w-0">
        <Link
          href={`/media-workspace/program/${first.id}`}
          className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
        >
          {first.name}
        </Link>
        {publications.length > 1 && (
          <p className="text-[9px] text-muted-foreground">+{publications.length - 1} in loop</p>
        )}
      </div>
    </div>
  );
}

function ContentCell({ row }: { row: NowNextRow }) {
  const first = row.current?.publications[0];
  if (!first) return EMPTY;
  const { content } = first;
  const href = contentHref(content);
  const name = content.name ?? first.content_name ?? CONTENT_KIND_LABELS[content.kind];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ContentKindIcon kind={content.kind} className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground">{CONTENT_KIND_LABELS[content.kind]}</p>
        {href ? (
          <Link
            href={href}
            className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
          >
            {name}
          </Link>
        ) : (
          <span className="block truncate text-[11px] font-semibold text-foreground">{name}</span>
        )}
      </div>
    </div>
  );
}

function RemainingCell({ row, asOf }: { row: NowNextRow; asOf: string }) {
  if (!row.current) return EMPTY;
  const percent = elapsedPercent(row.current, asOf);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tabular-nums text-foreground">{formatRemaining(row.current.remaining_seconds)}</span>
      {percent !== null && (
        <Progress
          value={percent}
          className="h-1.5 w-20"
        />
      )}
    </div>
  );
}

function NextCell({ row, timeZone }: { row: NowNextRow; timeZone: string }) {
  const next = nextEntry(row);
  if (!next) return EMPTY;
  if (next.kind === "continues") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <RepeatIcon className="h-3.5 w-3.5" />
        Continues
      </span>
    );
  }
  const [first] = next.occurrence.publications;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ProgramCover publication={first} />
      <div className="min-w-0">
        <Link
          href={`/media-workspace/program/${first.id}`}
          className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
        >
          {first.name}
        </Link>
        <p className="text-[9px] text-muted-foreground">Starts {formatClock(next.occurrence.opens_at, timeZone)}</p>
      </div>
    </div>
  );
}

function RowMenu({ row, returnTo }: { row: NowNextRow; returnTo: string }) {
  const edit = editProgramHref(row, returnTo);
  const calendar = row.channel ? `/media-workspace/calendar?channel=${row.channel.id}` : null;
  if (!edit && !calendar) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Row actions"
        >
          <MoreIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {edit && (
          <DropdownMenuItem asChild>
            <Link href={edit}>Edit Program</Link>
          </DropdownMenuItem>
        )}
        {calendar && (
          <DropdownMenuItem asChild>
            <Link href={calendar}>Open in Calendar</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const HEADERS = ["Channel", "Status", "Program", "Content", "Time remaining", "Next Program", ""];

export function NowPlayingTable({ rows, asOf, timeZone, returnTo }: { rows: NowNextRow[]; asOf: string; timeZone: string; returnTo: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-[10px]">
        <thead>
          <tr className="text-[9px] text-muted-foreground">
            {HEADERS.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 font-bold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = rowStatus(row);
            return (
              <tr
                key={`${row.row_type}-${row.channel?.id ?? row.device?.id}`}
                className="border-t border-border align-middle"
              >
                <td className="px-4 py-3"><ChannelCell row={row} /></td>
                <td className="px-4 py-3">
                  <Badge variant={status.tone}>{status.label}</Badge>
                  {row.channel?.expected_resolution && (
                    <p className="mt-1 text-[9px] text-muted-foreground">{row.channel.expected_resolution}</p>
                  )}
                </td>
                <td className="px-4 py-3"><ProgramCell row={row} /></td>
                <td className="px-4 py-3"><ContentCell row={row} /></td>
                <td className="px-4 py-3"><RemainingCell row={row} asOf={asOf} /></td>
                <td className="px-4 py-3"><NextCell row={row} timeZone={timeZone} /></td>
                <td className="px-2 py-3"><RowMenu row={row} returnTo={returnTo} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
