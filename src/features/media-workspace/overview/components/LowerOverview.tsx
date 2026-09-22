"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckCircle2, LayoutGrid, Megaphone, Monitor, Radio } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ChannelListItem } from "@/features/media-workspace/channels";
import type { PublicationListItem } from "@/features/media-workspace/publications";
import { scheduleDotClass, scheduleTime, targetSummary, todaysSchedule } from "../todays-schedule";
import { QuickActionsCard } from "./QuickActionsCard";

function formatTime(iso: string, timeZone = "Asia/Bangkok") {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso));
}

function typeIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("audio") || normalized.includes("pa")) return Megaphone;
  if (normalized.includes("tv")) return Radio;
  if (normalized.includes("kiosk")) return LayoutGrid;
  return Monitor;
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[8px_48px_minmax(0,1fr)_auto] items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

interface LowerOverviewProps {
  channels: ChannelListItem[] | null;
  publications: PublicationListItem[] | null;
  loadFailed: boolean;
}

// Channels + Publications are fetched once, on a shared 60s poll, by
// OverviewDashboard (docs/adr/0075 §7) — this used to fetch its own copy.
export function LowerOverview({ channels, publications, loadFailed }: LowerOverviewProps) {
  const data = useMemo(() => {
    const devices = channels?.flatMap((channel) => (channel.player === null ? [] : [channel.player])) ?? [];
    const health = { online: 0, warning: 0, offline: 0 };
    devices.forEach((device) => {
      health[device.health] += 1;
    });
    const types = new Map<string, number>();
    channels?.forEach((channel) => {
      const label = channel.channel_type?.name ?? "Unclassified";
      types.set(label, (types.get(label) ?? 0) + 1);
    });
    const activity = [
      ...(channels ?? []).map((channel) => ({
        label: `Channel “${channel.name}” updated`,
        at: channel.updated_at,
        icon: Monitor,
        color: "text-primary",
      })),
      ...(publications ?? []).map((publication) => ({
        label: `Publication “${publication.name}” updated`,
        at: publication.updated_at ?? publication.created_at ?? "",
        icon: CheckCircle2,
        color: "text-success",
      })),
    ]
      .filter((item) => item.at)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 4);

    return {
      health,
      total: devices.length,
      types: [...types.entries()].slice(0, 4),
      schedule: todaysSchedule(publications ?? []),
      activity,
    };
  }, [channels, publications]);

  const isLoading = channels === null || publications === null;
  const healthRows = [
    ["Online", data.health.online, "bg-success", "#22c55e"],
    ["Warning", data.health.warning, "bg-warning", "#f59e0b"],
    ["Offline", data.health.offline, "bg-danger", "#ef4444"],
  ] as const;

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-3 xl:grid-rows-[minmax(0,1fr)_auto]">
      <Card className="flex min-h-[509px] flex-col border-border p-5 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float xl:row-span-2">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">Today&apos;s Schedule</h2>
          <Link href="/media-workspace/publications" className="text-xs font-medium text-primary hover:underline">
            View full calendar →
          </Link>
        </div>
        {loadFailed ? (
          <p className="py-10 text-center text-sm text-danger">Could not load today&apos;s schedule</p>
        ) : isLoading ? (
          <ScheduleSkeleton />
        ) : data.schedule.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No scheduled publications for today</p>
        ) : (
          <ol>
            {data.schedule.map((row) => (
              <li key={row.id} className="grid grid-cols-[8px_52px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-4 text-xs last:border-0">
                <span className={`h-2 w-2 rounded-full ${scheduleDotClass(row)}`} />
                <time className="font-semibold text-muted-foreground">{scheduleTime(row)}</time>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{row.name}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">Program</span>
                </span>
                <span className="text-muted-foreground">{targetSummary(row.target_summary)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="flex min-h-0 flex-col border-border p-5 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float xl:col-start-2 xl:row-start-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">Channel Health</h2>
            <Link href="/media-workspace/channels" className="text-xs font-medium text-primary hover:underline">
              View all channels →
            </Link>
          </div>
          {loadFailed ? (
            <p className="py-8 text-center text-sm text-danger">Could not load channel health</p>
          ) : isLoading ? (
            <div className="flex flex-1 items-center gap-6">
              <Skeleton className="h-36 w-36 shrink-0 rounded-full" />
              <div className="flex-1 space-y-5">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-6">
              <div className="relative shrink-0 animate-ring-in">
                <DonutChart segments={healthRows.map(([label, value, , color]) => ({ label, value, color }))} size={144} strokeWidth={18} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-2xl text-foreground">{data.total}</strong>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-5">
                {healthRows.map(([label, value, color]) => (
                  <div key={label} className="text-sm">
                    <div className="mb-1.5 flex justify-between text-muted-foreground">
                      <span>
                        <i className={`mr-1.5 inline-block h-2 w-2 rounded-full ${color}`} />
                        {label}
                      </span>
                      <b className="text-foreground">{value}</b>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${data.total ? (value / data.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </Card>

      <Card className="border-border p-5 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float xl:col-start-2 xl:row-start-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">Channels by Type</h2>
            <Link href="/media-workspace/channels" className="text-xs font-medium text-primary hover:underline">
              View all channels →
            </Link>
          </div>
          {loadFailed ? (
            <p className="py-4 text-center text-sm text-danger">Could not load channel types</p>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : data.types.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No channel types available</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.types.map(([label, count]) => {
                const Icon = typeIcon(label);
                return (
                  <div key={label} className="rounded-lg border border-border p-3 text-center">
                    <Icon className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-2 truncate text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{count}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Channels</p>
                  </div>
                );
              })}
            </div>
          )}
      </Card>

      <div className="min-h-0 xl:col-start-3 xl:row-start-1">
        <QuickActionsCard />
      </div>
      <Card className="flex min-h-0 flex-col border-border p-4 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float xl:col-start-3 xl:row-start-2">
          <div className="mb-4 flex items-center justify-between">
            {/* Not an audit log — synthesized from each row's own `updated_at`
                (docs/adr/0075 §7), so it's labeled for what it actually is. */}
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">Recent Updates</h2>
          </div>
          {loadFailed ? (
            <p className="py-2 text-xs text-danger">Could not load recent updates</p>
          ) : isLoading ? (
            <ActivitySkeleton />
          ) : data.activity.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">No recent updates available</p>
          ) : (
            <ul className="space-y-3">
              {data.activity.map(({ label, at, icon: Icon, color }) => (
                <li key={`${label}-${at}`} className="flex items-center gap-3 text-xs">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground">{label}</span>
                  <time className="text-muted-foreground">{formatTime(at)}</time>
                </li>
              ))}
            </ul>
          )}
      </Card>
    </div>
  );
}
