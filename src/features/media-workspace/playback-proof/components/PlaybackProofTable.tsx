"use client";

import Link from "next/link";
import { FileImage } from "lucide-react";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { Badge } from "@/components/ui/lovable/badge";
import { isVideoUrl } from "@/lib/media-kind";
import type { PlaybackProofEntry } from "../playback-proof-api";
import { FAILURE_LABELS, formatDuration, formatPlayedAt, sourceLabel } from "../playback-proof-view";

const EMPTY = <span className="text-muted-foreground">—</span>;
const HEADERS = ["Played at", "Channel", "Program", "Source", "Media", "Result", "Duration"];

function MediaThumb({ url }: { url: string | null }) {
  return (
    <span className="grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
      {url && isVideoUrl(url) ? (
        <LazyVideo
          src={url}
          className="h-full w-full object-cover"
        />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small signed thumbnail; not worth next/image's config here.
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <FileImage className="h-4 w-4" />
      )}
    </span>
  );
}

function ResultCell({ entry }: { entry: PlaybackProofEntry }) {
  if (entry.outcome === "played") return <Badge variant="success">Played</Badge>;
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="danger">Failed</Badge>
      {entry.failure_reason && <span className="text-[9px] text-muted-foreground">{FAILURE_LABELS[entry.failure_reason]}</span>}
    </div>
  );
}

export function PlaybackProofTable({
  items,
  timeZone,
  selectedId,
  onSelect,
}: {
  items: PlaybackProofEntry[];
  timeZone: string;
  selectedId: string | null;
  onSelect: (entry: PlaybackProofEntry, opener: HTMLButtonElement | null) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-[10px]">
        <thead>
          <tr className="text-[9px] text-muted-foreground">
            {HEADERS.map((header) => (
              <th
                key={header}
                className="px-4 py-3 font-bold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => {
            const playedAt = formatPlayedAt(entry.played_at, timeZone);
            const source = sourceLabel(entry);
            return (
              <tr
                key={entry.id}
                onClick={(event) => onSelect(entry, event.currentTarget.querySelector("button"))}
                aria-selected={entry.id === selectedId}
                className="cursor-pointer border-t border-border align-middle hover:bg-muted/50 aria-selected:bg-primary-soft"
              >
                <td className="px-4 py-3 tabular-nums">
                  {/* The row is clickable for the mouse; this button is its keyboard / screen-reader entry. */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(entry, event.currentTarget);
                    }}
                    aria-label={`Open detail for ${entry.media.title} at ${playedAt.time}`}
                    className="text-left"
                  >
                    <span className="block text-[11px] font-semibold text-foreground">{playedAt.time}</span>
                    <span className="block text-[9px] text-muted-foreground">{playedAt.date}</span>
                  </button>
                </td>
                <td className="max-w-56 px-4 py-3">
                  {entry.channel ? (
                    <Link
                      href={`/media-workspace/channels?channel=${entry.channel.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
                    >
                      {entry.channel.name}
                    </Link>
                  ) : (
                    <span className="block truncate text-[11px] font-semibold text-foreground">No Channel</span>
                  )}
                  <p className="truncate text-[9px] text-muted-foreground">{entry.device.name ?? "Media Device"}</p>
                </td>
                <td className="max-w-48 px-4 py-3">
                  {entry.program ? (
                    <Link
                      href={`/media-workspace/program/${entry.program.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="block truncate text-[11px] font-semibold text-foreground hover:text-primary"
                    >
                      {entry.program.name}
                    </Link>
                  ) : (
                    <span title="The Player did not report which Program this was">{EMPTY}</span>
                  )}
                </td>
                <td className="max-w-48 px-4 py-3">
                  {source ? <span className="block truncate text-foreground">{source}</span> : EMPTY}
                </td>
                <td className="max-w-64 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MediaThumb url={entry.media.thumbnail_url} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-foreground">{entry.media.title}</p>
                      {entry.media.in_trash && (
                        <Badge
                          variant="neutral"
                          className="mt-0.5 px-1.5 py-0 text-[9px]"
                        >
                          In Trash
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ResultCell entry={entry} />
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">{formatDuration(entry.duration_played_seconds)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
