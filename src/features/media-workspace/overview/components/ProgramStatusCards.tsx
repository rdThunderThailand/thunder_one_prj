"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Radio } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchNowNext } from "@/features/media-workspace/publications";
import { mapNowNextPrograms, type NowNextPrograms, type ProgramCardModel } from "../now-next-programs";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(iso));
}

function ProgramCard({ label, model, isNow, emptyMessage }: { label: string; model: ProgramCardModel | null; isNow?: boolean; emptyMessage: string }) {
  if (model === null) {
    return (
      <Card className="flex h-[240px] flex-col justify-center rounded-xl border-border p-4 text-center shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">{label}</h2>
        <p className="mt-2 text-xs text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  const targetCount = model.channelRows || model.deviceRows;
  const targetLabel = model.channelRows ? "channels" : model.deviceRows ? "devices" : "targets";

  return (
    <Card className="flex h-[240px] flex-col rounded-xl border-border p-4 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">{label}</h2>
      </div>
      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4">
        {model.thumbnailUrl ? (
          // MediaThumb sniffs the extension off the signed URL, so a video cover renders
          // as a poster/preview instead of reaching next/image (see lib/media-kind).
          <MediaThumb url={model.thumbnailUrl} alt={model.name} className="h-[84px] w-28 rounded-lg" />
        ) : isNow ? (
          <div className="flex h-[84px] w-28 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-100">
            <Radio className="h-9 w-9" />
          </div>
        ) : (
          <time className="border-r border-border pr-3 text-2xl font-bold text-foreground">
            {model.opensAt ? formatTime(model.opensAt) : "—"}
          </time>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-bold text-foreground">{model.name}</h3>
            {isNow && (
              <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${model.playbackState === "confirmed" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                <i className={`h-1.5 w-1.5 rounded-full ${model.playbackState === "confirmed" ? "animate-pulse bg-success" : "bg-warning"}`} />
                {model.playbackState === "confirmed" ? "Live" : model.playbackState === "stale" ? "Stale" : "Awaiting player"}
              </span>
            )}
            {/* A merged loop airs several Publications on the same targets; the card stays
                single-Publication and discloses the rest rather than hiding them (ADR 0065 §2). */}
            {model.mergedWith > 0 && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">+{model.mergedWith} more</span>}
          </div>
          <p className="mt-1 text-[10px] capitalize text-muted-foreground">
            {model.publicationType}
            {!isNow && model.opensAt ? ` · Starts ${formatTime(model.opensAt)}` : ""}
          </p>
          <p className="mt-3 text-lg font-bold text-foreground">
            {targetCount}{" "}
            <span className="text-[10px] font-medium text-muted-foreground">{targetLabel}</span>
          </p>
          <div className="mt-4 grid grid-cols-2 border-t border-border pt-3 text-center">
            <span className="text-[10px] text-muted-foreground">
              <Monitor className="mx-auto h-3.5 w-3.5" />
              <strong className="mt-1 block text-foreground">{model.channelRows}</strong>
            </span>
            <span className="text-[10px] text-muted-foreground">
              <CheckCircle2 className="mx-auto h-3.5 w-3.5" />
              <strong className="mt-1 block text-foreground">
                {isNow ? model.confirmedRows : model.deviceRows}
              </strong>
            </span>
          </div>
        </div>
      </div>
      <Link href={`/media-workspace/publications/${model.id}`} className="mt-auto flex items-center justify-end gap-1 text-[10px] font-semibold text-primary hover:underline">
        {isNow ? "View program details" : "View schedule"}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card className="h-[240px] rounded-xl border-border p-4 shadow-panel">
      <Skeleton className="h-4 w-28" />
      <div className="mt-3 flex items-start gap-4">
        <Skeleton className="h-[84px] w-28" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
      </div>
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

  if (state.kind === "loading") {
    return (
      <>
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
      </>
    );
  }

  const failed = state.kind === "failed";
  const programs = state.kind === "ready" ? state.programs : { nowPlaying: null, nextUp: null };
  return (
    <>
      <ProgramCard label="Now Playing" model={programs.nowPlaying} isNow emptyMessage={failed ? "Live status unavailable" : "No playback confirmed"} />
      <ProgramCard label="Next Program" model={programs.nextUp} emptyMessage={failed ? "Live status unavailable" : "No upcoming program in the next 3 hours"} />
    </>
  );
}
