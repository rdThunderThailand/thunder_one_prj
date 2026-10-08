"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, FileImage } from "lucide-react";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { isVideoUrl } from "@/lib/media-kind";
import type { PlaybackProofEntry } from "../playback-proof-api";
import { FAILURE_LABELS, formatBytes, formatDuration, formatPlayedAt, relatedLinks, sourceLabel } from "../playback-proof-view";

function MediaPreview({ url }: { url: string | null }) {
  return (
    <div className="grid aspect-video w-full place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      {url && isVideoUrl(url) ? (
        <video
          src={url}
          controls
          muted
          preload="metadata"
          className="h-full w-full object-contain"
        />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a signed preview of variable size; not worth next/image's config here.
        <img
          src={url}
          alt=""
          className="h-full w-full object-contain"
        />
      ) : (
        <FileImage className="h-6 w-6" />
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function PlaybackProofDrawer({
  entry,
  timeZone,
  onClose,
  onCloseAutoFocus,
}: {
  entry: PlaybackProofEntry | null;
  timeZone: string;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const playedAt = entry ? formatPlayedAt(entry.played_at, timeZone) : null;
  const media = entry?.media;
  const mediaFacts = media
    ? [
        media.width && media.height ? `${media.width} × ${media.height}` : null,
        media.size_bytes ? formatBytes(media.size_bytes) : null,
        media.duration_seconds ? `${media.duration_seconds} sec` : null,
      ].filter(Boolean)
    : [];
  const mediaLink = entry && !entry.media.in_trash ? `/media-workspace/assets/${entry.media.id}` : null;

  return (
    <Sheet
      open={entry !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Playback Detail</SheetTitle>
          <SheetDescription>One slot as the Player reported it.</SheetDescription>
        </SheetHeader>
        {entry && media && playedAt && (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            <section className="flex flex-col gap-2">
              <MediaPreview url={media.thumbnail_url} />
              <div className="flex items-center gap-2">
                <p className="min-w-0 truncate text-sm font-bold text-foreground">{media.title}</p>
                <Badge
                  variant="info"
                  className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
                >
                  {media.kind}
                </Badge>
                {media.in_trash && (
                  <Badge
                    variant="neutral"
                    className="shrink-0 px-1.5 py-0 text-[10px]"
                  >
                    In Trash
                  </Badge>
                )}
              </div>
              {mediaFacts.length > 0 && <p className="text-[11px] text-muted-foreground">{mediaFacts.join(" · ")}</p>}
            </section>

            <dl className="divide-y divide-border rounded-lg border border-border px-3">
              <Fact label="Result">
                {entry.outcome === "played" ? (
                  <Badge variant="success">Played</Badge>
                ) : (
                  <span className="inline-flex flex-col items-end gap-1">
                    <Badge variant="danger">Failed</Badge>
                    {entry.failure_reason && <span className="text-[11px] text-muted-foreground">{FAILURE_LABELS[entry.failure_reason]}</span>}
                  </span>
                )}
              </Fact>
              <Fact label="Played at">
                {playedAt.date}, {playedAt.time}
              </Fact>
              <Fact label="Duration on screen">{formatDuration(entry.duration_played_seconds)}</Fact>
              <Fact label="Source">{sourceLabel(entry) ?? <span className="text-muted-foreground">Not reported</span>}</Fact>
            </dl>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-foreground">Related objects</h3>
              {!entry.program && (
                <p className="rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                  The Player did not report which Program this was, so no Program or Source is linked.
                </p>
              )}
              <ul className="divide-y divide-border rounded-lg border border-border">
                {relatedLinks(entry).map((link) => (
                  <li
                    key={link.label}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{link.label}</p>
                      <p className="truncate text-xs font-semibold text-foreground">{link.name}</p>
                      {link.note && <p className="text-[10px] text-muted-foreground">{link.note}</p>}
                    </div>
                    {link.href ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link href={link.href}>Open</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        Open
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
        <SheetFooter className="border-t border-border p-5">
          {mediaLink ? (
            <Button
              asChild
              className="w-full"
            >
              <Link href={mediaLink}>
                Open Media
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled
            >
              Open Media
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
