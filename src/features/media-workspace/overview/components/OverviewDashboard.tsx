"use client";

import { useEffect, useState } from "react";
import { fetchChannels, type ChannelListItem } from "@/features/media-workspace/channels";
import { LowerOverview } from "./LowerOverview";
import { ProgramStatusCards } from "./ProgramStatusCards";
import { RecentAlertsCard } from "./RecentAlertsCard";
import { StatCardsRow } from "./StatCardsRow";

export function OverviewDashboard() {
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchChannels()
      .then((rows) => { if (active) setChannels(rows); })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-4">
      <StatCardsRow channels={channels} loadFailed={loadFailed} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ProgramStatusCards />
        </div>
        <div className="xl:col-span-5">
          <RecentAlertsCard channels={channels} loadFailed={loadFailed} />
        </div>
        <div className="xl:col-span-12">
          <LowerOverview />
        </div>
      </div>
    </div>
  );
}
