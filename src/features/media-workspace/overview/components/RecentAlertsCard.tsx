import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRightIcon, MonitorIcon, WarningTriangleIcon, XIcon } from "@/components/ui/icons";
import { findChannelAttention, formatChannelLastSeen, type ChannelListItem } from "@/features/media-workspace/channels";

export function RecentAlertsCard({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const attention = channels ? findChannelAttention(channels).slice(0, 4) : [];

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Needs Attention</h2><Link href="/media-workspace/channels?q=attention" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">View all <ArrowRightIcon /></Link></div>
      {loadFailed ? <p className="py-8 text-center text-sm text-red-500">Could not load channel health</p> : channels === null ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div> : attention.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"><MonitorIcon className="h-6 w-6 text-emerald-500" /><p className="text-sm font-medium text-zinc-700">All devices are healthy</p></div> : (
        <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {attention.map(({ channel, device }) => {
            const isOffline = device.health === "offline";
            const Icon = isOffline ? XIcon : WarningTriangleIcon;
            return <li key={device.id}><Link href={`/media-workspace/channels?q=${encodeURIComponent(channel.name)}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isOffline ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}><Icon /></span><span className="min-w-0 flex-1 space-y-0.5"><span className="block truncate text-sm font-medium leading-5 text-zinc-900 dark:text-zinc-100">{channel.name}</span><span className="block truncate text-xs leading-4 text-zinc-500">{device.name} · {formatChannelLastSeen(device.last_heartbeat_at)}</span></span><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-500 dark:bg-zinc-800">{device.health}</span></Link></li>;
          })}
        </ul>
      )}
    </Card>
  );
}
