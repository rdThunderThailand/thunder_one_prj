"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRightIcon, BroadcastIcon, CheckCircleIcon, MonitorIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPublication, fetchPublications, type PublicationDetail } from "@/features/media-workspace/publications";
import { usePlaylistPreview } from "@/features/media-workspace/publications/hooks/usePlaylistPreview";
import { selectNextProgram, selectNowPlaying, type ProgramStatus } from "../program-status";

function targetSummary(status: ProgramStatus) {
  const parts = [];
  if (status.channelTargets) parts.push(`${status.channelTargets} Channels`);
  if (status.deviceTargets) parts.push(`${status.deviceTargets} Devices`);
  return parts.join(" · ") || "No targets";
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(iso));
}

function ProgramCard({ label, status, isNow }: { label: string; status: ProgramStatus | null; isNow?: boolean }) {
  // Hooks run before the empty-state return: a card with no program still has to
  // call them so the hook order stays stable when a program arrives.
  const { coverAssetId } = usePlaylistPreview(status?.publication.playlist?.id ?? null, true);
  const previewIds = useMemo(() => (coverAssetId ? [coverAssetId] : []), [coverAssetId]);
  const previews = usePreviewUrls(previewIds);
  const coverUrl = coverAssetId ? previews.urls[coverAssetId] : undefined;
  const coverThumbnailUrl = coverAssetId ? previews.thumbnailUrls[coverAssetId] : undefined;

  if (status === null) {
    return <Card className="flex min-h-74 flex-col justify-center p-4 text-center"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</h2><p className="mt-2 text-sm text-zinc-400">{isNow ? "No playback confirmed" : "No upcoming program"}</p></Card>;
  }

  const { publication } = status;
  const nextOpensAt = publication.playback_window?.next_opens_at;
  return (
    <Card className="flex min-h-74 flex-col p-4">
      <div className="mb-5 flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</h2>{isNow && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">LIVE</span>}</div>
      <div className="mb-5 flex items-center gap-4">
        {coverUrl ? (
          // MediaThumb sniffs the extension off the signed URL, so a video cover renders
          // as a poster/preview instead of reaching next/image (see lib/media-kind).
          <MediaThumb url={coverUrl} thumbnailUrl={coverThumbnailUrl} alt={publication.name} className="h-28 w-28 shrink-0 rounded-lg" />
        ) : isNow ? (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-100"><BroadcastIcon className="h-9 w-9" /></div>
        ) : (
          <time className="border-r border-zinc-100 pr-5 text-2xl font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">{nextOpensAt ? formatTime(nextOpensAt) : "—"}</time>
        )}
        <div className="min-w-0"><h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{publication.name}</h3><p className="mt-1 text-xs capitalize text-zinc-500">{publication.publication_type}{!isNow && nextOpensAt ? ` · Starts ${formatTime(nextOpensAt)}` : ""}</p><p className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{targetSummary(status)}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800"><span className="flex items-center gap-1 text-zinc-500"><MonitorIcon className="h-3.5 w-3.5" />{status.channelTargets} Channels</span><span className="flex items-center gap-1 text-zinc-500"><CheckCircleIcon className="h-3.5 w-3.5" />{isNow ? `${status.playingTargets} Playing` : `${status.deviceTargets} Devices`}</span></div>
      <Link href={`/media-workspace/publications/${publication.id}`} className="mt-auto flex items-center justify-end gap-1 pt-5 text-xs font-medium text-indigo-600 hover:text-indigo-500">View publication <ArrowRightIcon /></Link>
    </Card>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card className="min-h-74 p-4">
      <Skeleton className="h-4 w-28" />
      <div className="mt-5 flex items-center gap-4"><Skeleton className="h-28 w-28" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-1/2" /></div></div>
      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800"><Skeleton className="h-4" /><Skeleton className="h-4" /></div>
    </Card>
  );
}

export function ProgramStatusCards() {
  const [publications, setPublications] = useState<PublicationDetail[] | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => fetchPublications("active")
      .then((rows) => Promise.allSettled(rows.map((row) => fetchPublication(row.id))))
      .then((results) => { if (active) setPublications(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])); })
      .catch(() => { if (active) setPublications([]); });
    load();
    const interval = setInterval(load, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const { nowPlaying, nextProgram } = useMemo(() => ({ nowPlaying: selectNowPlaying(publications ?? []), nextProgram: selectNextProgram(publications ?? []) }), [publications]);

  if (publications === null) return <div className="grid h-full gap-4 lg:grid-cols-2"><ProgramCardSkeleton /><ProgramCardSkeleton /></div>;
  return <div className="grid h-full gap-4 lg:grid-cols-2"><ProgramCard label="Now Playing" status={nowPlaying} isNow /><ProgramCard label="Next Up" status={nextProgram} /></div>;
}
