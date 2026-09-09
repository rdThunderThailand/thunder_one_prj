import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircleIcon, MonitorIcon, WarningTriangleIcon, XIcon } from "@/components/ui/icons";
import { summarizeChannels, type ChannelListItem } from "@/features/media-workspace/channels";

const cards = [
  { key: "total", label: "Total Channels", href: "/media-workspace/channels", color: "indigo", Icon: MonitorIcon },
  { key: "online", label: "Online", href: "/media-workspace/channels?q=online", color: "emerald", Icon: CheckCircleIcon },
  { key: "warning", label: "Warning", href: "/media-workspace/channels?q=warning", color: "amber", Icon: WarningTriangleIcon },
  { key: "offline", label: "Offline", href: "/media-workspace/channels?q=offline", color: "red", Icon: XIcon },
] as const;

const colors = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
};

export function StatCardsRow({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const summary = channels ? summarizeChannels(channels) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, href, color, Icon }) => {
        const value = key === "total" ? summary?.lifecycle.total : summary?.devices[key];
        const total = key === "total" ? summary?.lifecycle.total : summary?.devices.total;
        const percent = total ? Math.round(((value ?? 0) / total) * 1000) / 10 : 0;
        return (
          <Link key={key} href={href} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Card className="flex min-h-31 flex-col gap-3 p-4 transition group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-sm">
              <div className="flex items-start justify-between"><p className="text-sm text-zinc-500">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[color].icon}`}><Icon /></span></div>
              {loadFailed ? <><span className="text-2xl font-semibold text-zinc-400">—</span><p className="text-xs text-red-500">Could not load channel health</p></> : summary === null ? <><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></> : <>
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
                <p className="text-xs text-zinc-500">{key === "total" ? `${summary.devices.total} Devices` : `${percent}% of Devices`}</p>
                <span className="mt-auto h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><span className={`block h-full rounded-full ${colors[color].bar}`} style={{ width: `${key === "total" ? 100 : percent}%` }} /></span>
              </>}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
