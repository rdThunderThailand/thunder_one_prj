"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRightIcon, BroadcastIcon, CheckCircleIcon, MonitorIcon } from "@/components/ui/icons";
import { fetchNowNext } from "@/features/media-workspace/publications";
import { mapNowNextPrograms, type NowNextPrograms, type ProgramCardModel } from "../now-next-programs";

function targetSummary(model: ProgramCardModel) {
  const parts = [];
  if (model.channelRows) parts.push(`${model.channelRows} Channels`);
  if (model.deviceRows) parts.push(`${model.deviceRows} Devices`);
  return parts.join(" · ") || "No targets";
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(iso));
}

function ProgramCard({ label, model, isNow, emptyMessage }: { label: string; model: ProgramCardModel | null; isNow?: boolean; emptyMessage: string }) {
  if (model === null) {
    return <Card className="flex min-h-74 flex-col justify-center p-4 text-center"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</h2><p className="mt-2 text-sm text-zinc-400">{emptyMessage}</p></Card>;
  }

  return (
    <Card className="flex min-h-74 flex-col p-4">
      <div className="mb-5 flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</h2>{isNow && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">LIVE</span>}</div>
      <div className="mb-5 flex items-center gap-4">
        {model.thumbnailUrl ? (
          // MediaThumb sniffs the extension off the signed URL, so a video cover renders
          // as a poster/preview instead of reaching next/image (see lib/media-kind).
          <MediaThumb url={model.thumbnailUrl} alt={model.name} className="h-28 w-28 shrink-0 rounded-lg" />
        ) : isNow ? (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-100"><BroadcastIcon className="h-9 w-9" /></div>
        ) : (
          <time className="border-r border-zinc-100 pr-5 text-2xl font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">{model.opensAt ? formatTime(model.opensAt) : "—"}</time>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{model.name}</h3>
            {/* A merged loop airs several Publications on the same targets; the card stays
                single-Publication and discloses the rest rather than hiding them (ADR 0065 §2). */}
            {model.mergedWith > 0 && <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">+{model.mergedWith} more</span>}
          </div>
          <p className="mt-1 text-xs capitalize text-zinc-500">{model.publicationType}{!isNow && model.opensAt ? ` · Starts ${formatTime(model.opensAt)}` : ""}</p>
          <p className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{targetSummary(model)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800"><span className="flex items-center gap-1 text-zinc-500"><MonitorIcon className="h-3.5 w-3.5" />{model.channelRows} Channels</span><span className="flex items-center gap-1 text-zinc-500"><CheckCircleIcon className="h-3.5 w-3.5" />{isNow ? `${model.confirmedRows} Playing` : `${model.deviceRows} Devices`}</span></div>
      <Link href={`/media-workspace/publications/${model.id}`} className="mt-auto flex items-center justify-end gap-1 pt-5 text-xs font-medium text-indigo-600 hover:text-indigo-500">View publication <ArrowRightIcon /></Link>
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

type CardsState = { kind: "loading" } | { kind: "ready"; programs: NowNextPrograms } | { kind: "failed" };

// The horizon the ADR 0065 §2 contract fixes: one request serves both cards, and Next Up can
// only see three hours — which is why its empty state says so rather than "no upcoming program".
const HORIZON_MINUTES = 180;

export function ProgramStatusCards() {
  const [state, setState] = useState<CardsState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const load = () => fetchNowNext(HORIZON_MINUTES, false)
      .then((value) => { if (active) setState({ kind: "ready", programs: mapNowNextPrograms(value) }); })
      // Never the demo data NowNextPage falls back to in development: Overview's headline is
      // not a place to show invented programmes, so a failure says so instead (ADR 0065 §2).
      .catch(() => { if (active) setState({ kind: "failed" }); });
    // The mount fetch always runs, even for a tab opened in the background — only the
    // recurring poll pauses while hidden, so a tab left open all day stops burning it.
    load();
    const poll = () => { if (!document.hidden) load(); };
    const interval = setInterval(poll, 60_000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (state.kind === "loading") return <div className="grid h-full gap-4 lg:grid-cols-2"><ProgramCardSkeleton /><ProgramCardSkeleton /></div>;

  const failed = state.kind === "failed";
  const programs = state.kind === "ready" ? state.programs : { nowPlaying: null, nextUp: null };
  return <div className="grid h-full gap-4 lg:grid-cols-2">
    <ProgramCard label="Now Playing" model={programs.nowPlaying} isNow emptyMessage={failed ? "Live status unavailable" : "No playback confirmed"} />
    <ProgramCard label="Next Up" model={programs.nextUp} emptyMessage={failed ? "Live status unavailable" : "No upcoming program in the next 3 hours"} />
  </div>;
}
