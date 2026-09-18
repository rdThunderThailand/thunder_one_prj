"use client";

import { useEffect, useState, type ReactNode } from "react";
import { channelTypeKey, fetchChannels, type ChannelListItem, type ChannelTypeFilter } from "@/features/media-workspace/channels";
import { fetchPublications, type PublicationListItem } from "@/features/media-workspace/publications";
import { LowerOverview } from "./LowerOverview";
import { ProgramStatusCards } from "./ProgramStatusCards";
import { RecentAlertsCard } from "./RecentAlertsCard";
import { StatCardsRow } from "./StatCardsRow";

const TABS: Array<{ label: string; value: ChannelTypeFilter | "all" }> = [
  { label: "All channels", value: "all" },
  { label: "Screens", value: "screen" },
  { label: "TV", value: "tv" },
  { label: "Kiosks", value: "kiosk" },
];

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" }).format(date);
}

export function OverviewDashboard({ actions }: { actions?: ReactNode }) {
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [publications, setPublications] = useState<PublicationListItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [filter, setFilter] = useState<ChannelTypeFilter | "all">("all");

  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([fetchChannels(), fetchPublications("active")])
        .then(([channelRows, publicationRows]) => {
          if (!active) return;
          setChannels(channelRows);
          setPublications(publicationRows);
          setLoadFailed(false);
          setUpdatedAt(new Date());
        })
        .catch(() => {
          if (active) setLoadFailed(true);
        });
    // Same mount-always / poll-only-while-visible pattern as ProgramStatusCards,
    // so the whole page shares one refresh cadence (docs/adr/0075 §7).
    load();
    const poll = () => { if (!document.hidden) load(); };
    const interval = setInterval(poll, 60_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, []);

  const filteredChannels = channels === null ? null : filter === "all" ? channels : channels.filter((channel) => channelTypeKey(channel) === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={filter === tab.value}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab.value ? "bg-card text-foreground shadow-panel" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <StatCardsRow channels={filteredChannels} loadFailed={loadFailed} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProgramStatusCards />
        <RecentAlertsCard channels={filteredChannels} loadFailed={loadFailed} />
      </div>
      <LowerOverview channels={filteredChannels} publications={publications} loadFailed={loadFailed} />

      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <i className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Auto refresh: <strong className="font-semibold text-success">On</strong>
          {updatedAt && <span className="ml-3">Last updated: {formatUpdatedAt(updatedAt)}</span>}
        </span>
        <span>Time zone: Asia/Bangkok (UTC+7)</span>
      </footer>
    </div>
  );
}
