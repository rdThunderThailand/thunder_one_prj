import Link from "next/link";
import { ArrowRight, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { channelTypeLabel, findChannelAttention, formatChannelLastSeen, type ChannelListItem } from "@/features/media-workspace/channels";

export function RecentAlertsCard({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const attention = channels ? findChannelAttention(channels).slice(0, 4) : [];

  return (
    <Card className="flex h-[240px] flex-col overflow-hidden rounded-xl border-border p-4 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">Needs Attention</h2>
        <Link href="/media-workspace/channels?q=attention" className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
          View all alerts
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loadFailed ? <p className="py-8 text-center text-xs text-danger">Could not load channel health</p> : channels === null ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-9 w-full" />)}</div> : attention.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"><CheckCircle2 className="h-6 w-6 text-success" /><p className="text-xs font-medium text-foreground">All devices are healthy</p></div> : (
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-hidden">
          {attention.map(({ channel, device }) => {
            const isOffline = device.health === "offline";
            const Icon = isOffline ? XCircle : TriangleAlert;
            const lastSeen = formatChannelLastSeen(device.last_heartbeat_at).replace(/^Last seen /, "");
            return (
              <li key={device.id}>
                <Link
                  href={`/media-workspace/channels/${channel.id}/edit`}
                  aria-label={`Open ${channel.name}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md py-2 transition-colors hover:bg-muted/60"
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${isOffline ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold leading-4 text-foreground">{channel.name} · {device.name}</span>
                    <span className="mt-0.5 block truncate text-[9px] capitalize leading-3 text-muted-foreground">Player {device.health}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground">{lastSeen}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[8px] font-semibold text-muted-foreground">{channelTypeLabel(channel)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
