"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { requestApi } from "@/lib/api/media-api";
import { getDemoNowNext } from "../now-next-demo";
import { timelinePosition, timelineTicks, timelineWindow } from "../now-next-layout";
import type { NowNextOccurrence, NowNextResponse, NowNextRow } from "../now-next";

const emptySummary = { scheduled_now_channels: 0, playback_confirmed_channels: 0, upcoming_60m_channels: 0, upcoming_3h_channels: 0, total_active_channels: 0 };

function fetchNowNext(horizon: 60 | 180, includeIdle: boolean, query: string) {
  const params = new URLSearchParams({ horizon_minutes: String(horizon), include_idle: String(includeIdle) });
  if (query.trim()) params.set("q", query.trim());
  return requestApi<NowNextResponse>("GET", `/media/now-next?${params}`);
}

function formatTime(value: string | null | undefined, timezone: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(value));
}

function formatRemaining(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const minutes = Math.max(0, Math.floor(seconds / 60));
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function PublicationCell({ occurrence, timezone, showTime = false }: { occurrence: NowNextOccurrence | null | undefined; timezone: string; showTime?: boolean }) {
  const publication = occurrence?.publications[0];
  if (!publication) return <span className="text-zinc-400">—</span>;
  return <div className="flex min-w-0 items-center gap-2">
    <MediaThumb url={publication.thumbnail_url ?? undefined} alt={publication.name} className="h-10 w-16 rounded-md" />
    <div className="min-w-0">
      <Link className="block truncate font-medium text-indigo-600 hover:text-indigo-500" href={`/media-workspace/publications/${publication.id}`}>{publication.name}</Link>
      <div className="truncate text-xs text-zinc-500">{showTime ? `Starts ${formatTime(occurrence?.opens_at, timezone)}` : occurrence?.output_kind === "merged_loop" ? "Merged loop" : publication.publication_type}</div>
    </div>
  </div>;
}

function Row({ row, timezone }: { row: NowNextRow; timezone: string }) {
  const title = row.channel?.name ?? row.device?.name ?? "Direct Media Device";
  const status = row.current?.playback_state ?? "not_confirmed";
  const statusLabel = status === "confirmed" ? "Playback Confirmed" : status === "stale" ? "Playback stale" : "Scheduled";
  return <tr className="border-t border-zinc-100 dark:border-zinc-800">
    <td className="min-w-0 px-4 py-3"><div className="truncate font-medium text-zinc-900 dark:text-zinc-50">{title}</div><div className="truncate text-xs text-zinc-500">{row.channel ? `${row.devices.length} Media Device${row.devices.length === 1 ? "" : "s"}` : "Direct target"}</div></td>
    <td className="min-w-0 px-3 py-3"><Badge color={status === "confirmed" ? "green" : status === "stale" ? "yellow" : "zinc"} variant="pill">{statusLabel}</Badge></td>
    <td className="min-w-0 px-3 py-3"><PublicationCell occurrence={row.current} timezone={timezone} /></td>
    <td className="min-w-0 px-3 py-3 text-zinc-600 dark:text-zinc-400">{formatRemaining(row.current?.remaining_seconds)}</td>
    <td className="min-w-0 px-4 py-3"><PublicationCell occurrence={row.upcoming[0]} timezone={timezone} showTime /></td>
  </tr>;
}

const priorityStyles = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  normal: "border-indigo-200 bg-indigo-50 text-indigo-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function ScheduleTimeline({ rows, asOf, horizon, timezone }: { rows: NowNextRow[]; asOf: string; horizon: 60 | 180; timezone: string }) {
  const ticks = timelineTicks(asOf, horizon);
  const { current, start, end } = timelineWindow(asOf, horizon);
  const currentLeft = ((current - start) / (end - start)) * 100;
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const hoverTime = hoverPercent == null ? null : new Date(start + ((end - start) * hoverPercent) / 100).toISOString();
  return <Card className="overflow-hidden p-0">
    <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
      <div><h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Up Next <span className="text-xs font-medium text-zinc-400">(NEXT {horizon === 60 ? "60 MINUTES" : "3 HOURS"})</span></h2><p className="text-xs text-zinc-500">Effective publication schedule by Channel and Media Device</p></div>
      <div className="flex gap-4 text-xs"><span className="text-orange-600">● High</span><span className="text-indigo-600">● Normal</span><span className="text-emerald-600">● Low</span></div>
    </div>
    <div
      className="relative grid grid-cols-[240px_minmax(0,1fr)]"
      onMouseLeave={() => setHoverPercent(null)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const timelineWidth = rect.width - 240;
        const pointerX = event.clientX - rect.left - 240;
        setHoverPercent(pointerX < 0 ? null : Math.max(0, Math.min(100, (pointerX / timelineWidth) * 100)));
      }}
    >
      {hoverPercent != null && hoverTime && <div className="pointer-events-none absolute inset-y-0 left-[240px] right-0 z-30"><div className="absolute inset-y-0 w-px bg-zinc-700/70" style={{ left: `${hoverPercent}%` }}><span className="absolute left-1/2 top-0 -translate-x-1/2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">{formatTime(hoverTime, timezone)}</span></div></div>}
      <div className="border-r border-zinc-100 px-4 py-3 text-xs font-medium text-zinc-500 dark:border-zinc-800">Channel / Media Device</div>
      <div className="relative h-11 border-b border-zinc-100 dark:border-zinc-800">
        {ticks.map((tick, index) => <span key={tick} className={`absolute top-3 text-[11px] font-medium text-zinc-500 ${index === 0 ? "" : index === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `${(index / (ticks.length - 1)) * 100}%` }}>{formatTime(tick, timezone)}</span>)}
        <span className="absolute top-0 -translate-x-1/2 rounded-b bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ left: `${currentLeft}%` }}>Now</span>
      </div>
      {rows.map((row) => {
        const occurrences = [row.current, ...row.upcoming].filter((item): item is NowNextOccurrence => Boolean(item));
        const name = row.channel?.name ?? row.device?.name ?? "Direct Media Device";
        return <div className="contents" key={`timeline-${row.row_type}-${row.channel?.id ?? row.device?.id}`}>
          <div className="flex min-w-0 items-center gap-2 border-r border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800"><MediaThumb url={occurrences[0]?.publications[0]?.thumbnail_url ?? undefined} alt={name} className="h-9 w-12 rounded-md" /><div className="min-w-0"><div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{name}</div><div className="text-[11px] text-zinc-500">{row.channel ? `${row.devices.length} Media Device${row.devices.length === 1 ? "" : "s"}` : "Direct target"}</div></div></div>
          <div className="relative h-[58px] border-t border-zinc-100 bg-[linear-gradient(to_right,transparent_calc(25%-1px),rgb(244_244_245)_25%,transparent_calc(25%+1px),transparent_calc(50%-1px),rgb(244_244_245)_50%,transparent_calc(50%+1px),transparent_calc(75%-1px),rgb(244_244_245)_75%,transparent_calc(75%+1px))] dark:border-zinc-800">
            <span className="absolute inset-y-0 z-10 w-px bg-indigo-400" style={{ left: `${currentLeft}%` }} />
            {occurrences.map((occurrence) => { const position = timelinePosition(occurrence.opens_at, occurrence.closes_at, asOf, horizon); const publication = occurrence.publications[0]; const label = `${publication?.name ?? "Publication"} · ${formatTime(occurrence.opens_at, timezone)}–${formatTime(occurrence.closes_at, timezone)}`; return <Link key={occurrence.occurrence_id} href={publication ? `/media-workspace/publications/${publication.id}` : "/media-workspace/publications/manage"} aria-label={`View ${label}`} title={label} className={`absolute top-1.5 h-[46px] overflow-hidden rounded-md border px-2 py-1 outline-none transition-shadow hover:ring-2 hover:ring-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500 ${priorityStyles[occurrence.priority]}`} style={{ left: `${position.left}%`, width: `${position.width}%` }}><div className="truncate text-xs font-semibold">{publication?.name ?? "Publication"}</div><div className="truncate text-[10px] opacity-75">{formatTime(occurrence.opens_at, timezone)}–{formatTime(occurrence.closes_at, timezone)}</div></Link>; })}
          </div>
        </div>;
      })}
    </div>
  </Card>;
}

export function NowNextPage() {
  const [horizon, setHorizon] = useState<60 | 180>(60);
  const [includeIdle, setIncludeIdle] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<NowNextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoReason, setDemoReason] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetchNowNext(horizon, includeIdle, query).then((value) => {
      if (!alive) return;
      if (process.env.NODE_ENV === "development" && value.rows.every((row) => !row.current && row.upcoming.length === 0)) {
        setData(getDemoNowNext(horizon, includeIdle, query));
        setDemoReason("Backend returned no active schedule");
      } else {
        setData(value);
        setDemoReason(null);
      }
      setError(null);
    }).catch(() => {
      if (!alive) return;
      if (process.env.NODE_ENV === "development") {
        setData(getDemoNowNext(horizon, includeIdle, query));
        setDemoReason("Backend read model is unavailable");
        setError(null);
      } else {
        setError("Now & Next backend read model is not available yet");
      }
    });
    load();
    const timer = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [horizon, includeIdle, query]);

  const summary = data?.summary ?? emptySummary;
  const rows = useMemo(() => data?.rows ?? [], [data]);
  return <div className="flex flex-col gap-5">
    <PageHeader title="Now & Next" subtitle="See what is scheduled now and coming up on your Channels." actions={<div className="flex gap-2"><Button variant="secondary" disabled>Filters</Button><Button variant="secondary" disabled>Live View</Button><Link className={buttonClasses("secondary")} href="/media-workspace/publications/manage">Manage Publications</Link></div>} />
    <div className="flex flex-wrap items-center gap-2"><input aria-label="Search Channel, Media Device or Publication" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Channel, Media Device or Publication" className="min-w-64 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900" /><Button variant={horizon === 60 ? "primary" : "secondary"} onClick={() => setHorizon(60)}>Next 60 min</Button><Button variant={horizon === 180 ? "primary" : "secondary"} onClick={() => setHorizon(180)}>Next 3 hours</Button><Button variant={includeIdle ? "primary" : "secondary"} onClick={() => setIncludeIdle((value) => !value)}>Show idle channels</Button></div>
    {demoReason && <Card className="flex items-center gap-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"><Badge color="blue" variant="pill">Demo data</Badge><span>{demoReason}. Development only; real data takes priority automatically.</span></Card>}
    {error && <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}. The page does not use mock data.</Card>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Scheduled Now", summary.scheduled_now_channels], ["Playback Confirmed", summary.playback_confirmed_channels], ["Upcoming 60m", summary.upcoming_60m_channels], ["Upcoming 3h", summary.upcoming_3h_channels]].map(([label, value]) => <Card key={label} className="p-4"><p className="text-sm text-zinc-500">{label}</p><div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{data ? value : <Skeleton className="h-8 w-16" />}</div><p className="mt-1 text-xs text-zinc-400">Distinct Channels</p></Card>)}</div>
    <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800"><div><h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Now Playing</h2><p className="text-xs text-zinc-500">Effective output as of {data ? `${formatTime(data.as_of, data.display_timezone)} ${data.display_timezone}` : "—"}</p></div><span className="text-xs text-zinc-400">Auto-refresh 60s</span></div><div className="overflow-hidden"><table className="w-full table-fixed text-left text-sm"><colgroup><col className="w-[24%]" /><col className="w-[14%]" /><col className="w-[23%]" /><col className="w-[11%]" /><col className="w-[28%]" /></colgroup><thead><tr className="text-xs text-zinc-400"><th className="px-4 py-3">Channel / Media Device</th><th className="px-3 py-3">Playback</th><th className="px-3 py-3">Current Publication</th><th className="px-3 py-3">Time remaining</th><th className="px-4 py-3">Next Publication</th></tr></thead><tbody>{rows.length ? rows.map((row) => <Row key={`${row.row_type}-${row.channel?.id ?? row.device?.id}`} row={row} timezone={data?.display_timezone ?? "Asia/Bangkok"} />) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-400">{data ? "No effective content in this horizon" : "Loading Now & Next…"}</td></tr>}</tbody></table></div></Card>
    {data && rows.length > 0 ? <ScheduleTimeline rows={rows} asOf={data.as_of} horizon={horizon} timezone={data.display_timezone} /> : <Card className="p-5 text-sm text-zinc-400">No schedule in this horizon</Card>}
  </div>;
}
