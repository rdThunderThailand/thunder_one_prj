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

// 2026-09-19: icon chips matched to the design reference's own pattern — a
// single neutral bg-muted chip with a semantic-colored icon (not a per-stat
// pastel background); `.bar` (the mini progress bar at the bottom of each
// card) keeps a solid semantic fill, that part already matched the
// reference as-is.
const colors = {
  indigo: { icon: "bg-muted text-primary", bar: "bg-primary" },
  emerald: { icon: "bg-muted text-success", bar: "bg-success" },
  amber: { icon: "bg-muted text-warning", bar: "bg-warning" },
  red: { icon: "bg-muted text-danger", bar: "bg-danger" },
};

export function StatCardsRow({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const summary = channels ? summarizeChannels(channels) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, href, color, Icon }) => {
        // ADR 0074 §4: Channel status is the Player's health, so this rolls up Channels now,
        // not Devices — `summary` is flat ({ total, online, warning, offline }).
        const value = summary?.[key];
        const percent = summary?.total ? Math.round(((value ?? 0) / summary.total) * 1000) / 10 : 0;
        return (
          <Link key={key} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="flex min-h-31 flex-col gap-3 p-4 transition group-hover:-translate-y-0.5">
              {/* 2026-09-19: label/value/sub-text sizes matched to the design
                  reference (11px/600, 24px/700, 10px). */}
              <div className="flex items-start justify-between"><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[color].icon}`}><Icon /></span></div>
              {loadFailed ? <><span className="text-2xl font-bold text-muted-foreground">—</span><p className="text-2xs text-danger">Could not load channel health</p></> : summary === null ? <><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></> : <>
                <span className="text-2xl font-bold text-foreground">{value}</span>
                <p className="text-2xs text-muted-foreground">{key === "total" ? `${summary.total} Channels` : `${percent}% of Channels`}</p>
                <span className="mt-auto h-1.5 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${colors[color].bar}`} style={{ width: `${key === "total" ? 100 : percent}%` }} /></span>
              </>}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
