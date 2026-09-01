"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BroadcastIcon,
  CheckCircleIcon,
  LayoutIcon,
  MegaphoneIcon,
  MonitorIcon,
} from "@/components/ui/icons";
import { fetchChannels, type ChannelListItem } from "@/features/media-workspace/channels";
import { fetchPublication, fetchPublications, type PublicationDetail, type PublicationListItem } from "@/features/media-workspace/publications";
import { QuickActionsCard } from "./QuickActionsCard";

type LoadedPublication = { list: PublicationListItem; detail: PublicationDetail };

function formatTime(iso: string, timeZone = "Asia/Bangkok") {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
}

function isToday(iso: string, timeZone: string) {
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return format.format(new Date(iso)) === format.format(new Date());
}

function typeIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("audio") || normalized.includes("pa")) return MegaphoneIcon;
  if (normalized.includes("tv")) return BroadcastIcon;
  if (normalized.includes("kiosk")) return LayoutIcon;
  return MonitorIcon;
}

function ScheduleSkeleton() {
  return <div className="space-y-4 py-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="grid grid-cols-[8px_48px_minmax(0,1fr)_auto] items-center gap-2"><Skeleton className="h-2 w-2 rounded-full" /><Skeleton className="h-4 w-10" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-16" /></div>)}</div>;
}

function ActivitySkeleton() {
  return <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-10" /></div>)}</div>;
}

export function LowerOverview() {
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [publications, setPublications] = useState<LoadedPublication[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchChannels(), fetchPublications("active")])
      .then(async ([channelRows, publicationRows]) => {
        const details = await Promise.allSettled(publicationRows.map((row) => fetchPublication(row.id)));
        if (!active) return;
        setChannels(channelRows);
        setPublications(details.flatMap((result, index) => result.status === "fulfilled" ? [{ list: publicationRows[index], detail: result.value }] : []));
      })
      .catch(() => {
        if (!active) return;
        setChannels([]);
        setPublications([]);
      });
    return () => { active = false; };
  }, []);

  const data = useMemo(() => {
    const devices = channels?.flatMap((channel) => channel.devices) ?? [];
    const health = { online: 0, warning: 0, offline: 0 };
    devices.forEach((device) => { health[device.health] += 1; });
    const total = devices.length;
    const types = new Map<string, number>();
    channels?.forEach((channel) => {
      const label = channel.channel_type?.name ?? "Unclassified";
      types.set(label, (types.get(label) ?? 0) + 1);
    });
    const schedule = (publications ?? [])
      .filter(({ detail }) => detail.schedule && isToday(detail.schedule.starts_at, detail.schedule.timezone))
      .sort((a, b) => Date.parse(a.detail.schedule!.starts_at) - Date.parse(b.detail.schedule!.starts_at))
      .slice(0, 6);
    const activity = [
      ...(channels ?? []).map((channel) => ({ label: `Channel “${channel.name}” updated`, at: channel.updated_at, icon: MonitorIcon, color: "text-indigo-500" })),
      ...(publications ?? []).map(({ list }) => ({ label: `Publication “${list.name}” updated`, at: list.updated_at ?? list.created_at ?? "", icon: CheckCircleIcon, color: "text-emerald-500" })),
    ].filter((item) => item.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 4);
    return { health, total, types: [...types.entries()].slice(0, 4), schedule, activity };
  }, [channels, publications]);

  const isLoading = channels === null || publications === null;
  const healthRows = [
    ["Online", data.health.online, "bg-emerald-500"],
    ["Warning", data.health.warning, "bg-amber-500"],
    ["Offline", data.health.offline, "bg-red-500"],
  ] as const;

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <Card className="min-h-88 xl:col-span-5 p-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s Schedule</h2><span className="text-xs text-zinc-400">Live data</span></div>
        {isLoading ? <ScheduleSkeleton /> : data.schedule.length === 0 ? <p className="py-10 text-center text-sm text-zinc-400">No scheduled publications for today</p> : <ol className="space-y-3">
          {data.schedule.map(({ list, detail }) => <li key={list.id} className="grid grid-cols-[8px_48px_minmax(0,1fr)_auto] items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-blue-500" /><time className="font-semibold text-zinc-700 dark:text-zinc-200">{formatTime(detail.schedule!.starts_at, detail.schedule!.timezone)}</time><span className="truncate font-medium text-zinc-800 dark:text-zinc-100">{list.name}</span><span className="text-zinc-400">{detail.publication_targets?.length ?? 0} Channels</span></li>)}
        </ol>}
      </Card>

      <div className="space-y-4 xl:col-span-3">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Channel Health</h2><span className="text-xs text-zinc-400">Live data</span></div>
          {isLoading ? <div className="flex items-center gap-5"><Skeleton className="h-28 w-28 shrink-0 rounded-full" /><div className="flex-1 space-y-4"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div></div> : <div className="flex items-center gap-5">
            <div className="relative shrink-0"><DonutChart segments={healthRows.map(([label, value, color]) => ({ label, value, color: color === "bg-emerald-500" ? "#22c55e" : color === "bg-amber-500" ? "#f59e0b" : "#ef4444" }))} size={112} strokeWidth={16} /><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-zinc-900 dark:text-zinc-50">{data.total}</strong><span className="text-[10px] text-zinc-400">Devices</span></div></div>
            <div className="min-w-0 flex-1 space-y-3">{healthRows.map(([label, value, color]) => <div key={label} className="text-xs"><div className="mb-1 flex justify-between text-zinc-600 dark:text-zinc-400"><span><i className={`mr-1.5 inline-block h-2 w-2 rounded-full ${color}`} />{label}</span><b className="text-zinc-900 dark:text-zinc-50">{value}</b></div><div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className={`${color} h-full rounded-full`} style={{ width: `${data.total ? (value / data.total) * 100 : 0}%` }} /></div></div>)}</div>
          </div>}
        </Card>

       

        <Card className="p-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Channels by Type</h2><span className="text-xs text-zinc-400">Live data</span></div>
        {isLoading ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"><Skeleton className="mx-auto h-5 w-5" /><Skeleton className="mx-auto mt-2 h-3 w-12" /><Skeleton className="mx-auto mt-2 h-6 w-8" /></div>)}</div> : data.types.length === 0 ? <p className="py-4 text-center text-sm text-zinc-400">No channel types available</p> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{data.types.map(([label, count]) => { const Icon = typeIcon(label); return <div key={label} className="rounded-lg border border-zinc-100 p-3 text-center dark:border-zinc-800"><Icon className="mx-auto h-5 w-5 text-indigo-500" /><p className="mt-2 truncate text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</p><p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{count}</p><p className="mt-1 text-[10px] text-zinc-400">Channels</p></div>; })}</div>}
      </Card>
      </div>

      <div className="space-y-4 xl:col-span-4">
        <QuickActionsCard />
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Activity Feed</h2></div>
          {isLoading ? <ActivitySkeleton /> : data.activity.length === 0 ? <p className="py-2 text-xs text-zinc-400">No recent updates available</p> : <ul className="space-y-2.5">{data.activity.map(({ label, at, icon: Icon, color }) => <li key={`${label}-${at}`} className="flex items-center gap-2 text-xs"><Icon className={`h-4 w-4 shrink-0 ${color}`} /><span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-200">{label}</span><time className="text-zinc-400">{formatTime(at)}</time></li>)}</ul>}
        </Card>
      </div>
    </div>
  );
}
