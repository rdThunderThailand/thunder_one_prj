import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gauge, Monitor, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { summarizeChannels, type ChannelListItem } from "@/features/media-workspace/channels";

const cards = [
  { key: "total", label: "Total Channels", href: "/media-workspace/channels", color: "indigo", Icon: Monitor },
  { key: "online", label: "Online", href: "/media-workspace/channels?q=online", color: "emerald", Icon: CheckCircle2 },
  { key: "warning", label: "Warning", href: "/media-workspace/channels?q=warning", color: "amber", Icon: AlertTriangle },
  { key: "offline", label: "Offline", href: "/media-workspace/channels?q=offline", color: "red", Icon: XCircle },
] as const;

// 2026-09-19: icon chips matched to the design reference's own pattern — a
// single neutral bg-muted chip with a semantic-colored icon (not a per-stat
// pastel background); `.bar` (the mini progress bar at the bottom of each
// card) keeps a solid semantic fill, that part already matched the
// reference as-is.
const colors = {
  indigo: { icon: "bg-primary-soft text-primary", bar: "bg-primary" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
};

export function StatCardsRow({ channels, loadFailed }: { channels: ChannelListItem[] | null; loadFailed: boolean }) {
  const summary = channels ? summarizeChannels(channels) : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, href, color, Icon }) => {
        // ADR 0074 §4: Channel status is the Player's health, so this rolls up Channels now,
        // not Devices — `summary` is flat ({ total, online, warning, offline }).
        const value = summary?.[key];
        const percent = summary?.total ? Math.round(((value ?? 0) / summary.total) * 1000) / 10 : 0;
        return (
          <Link key={key} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="flex h-[140px] flex-col rounded-xl border-border p-4 shadow-panel transition group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-float">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[color].icon}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {loadFailed ? (
                <>
                  <span className="mt-2 text-2xl font-bold text-zinc-400">—</span>
                  <p className="mt-auto truncate text-[10px] text-red-500">Could not load channel health</p>
                </>
              ) : summary === null ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <span className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</span>
                  <p className="mt-auto truncate text-[10px] text-muted-foreground">
                    {key === "total" ? `${summary.total} Channels` : `${percent}% of Channels`}
                  </p>
                  <span className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={`block h-full origin-left animate-grow-bar rounded-full ${colors[color].bar}`}
                      style={{ width: `${key === "total" ? 100 : percent}%` }}
                    />
                  </span>
                </>
              )}
            </Card>
          </Link>
        );
      })}
      {/* Delivery success rate has no aggregate endpoint yet (docs/adr/0075 §7) —
          an honest empty state, not the Lovable mockup's invented "98.6%". */}
      <Card className="flex h-[140px] flex-col overflow-hidden rounded-xl border-border p-3 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
        <EmptyState icon={Gauge} title="No delivery data" detail="Delivery success rate isn't tracked yet." compact />
      </Card>
    </div>
  );
}
