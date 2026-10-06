"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Clock, Radio, Timer } from "lucide-react";
import { LibrarySummary, LibrarySummarySkeleton } from "../../../content-library/LibraryChrome";
import type { NowNextResponse } from "../../now-next";

function useClock(timeZone: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return now === null ? "—" : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone }).format(now);
}

/** Four KPI cards (ADR 0084 §4). Owns the ticking clock so the table and timeline do not re-render each second. */
export function NowNextKpiCards({ data }: { data: NowNextResponse | null }) {
  const clock = useClock(data?.display_timezone ?? "Asia/Bangkok");
  if (!data) return <LibrarySummarySkeleton count={4} />;
  const { summary } = data;
  return (
    <LibrarySummary
      label="Now and next summary"
      cards={[
        { label: "Live now", value: summary.playback_confirmed_channels, detail: "Channels with confirmed playback", icon: Radio, tone: "text-success bg-success-soft" },
        { label: "Next 60 minutes", value: summary.upcoming_60m_channels, detail: "Channels with upcoming programs", icon: CalendarClock, tone: "text-warning bg-warning-soft" },
        { label: "Next 3 hours", value: summary.upcoming_3h_channels, detail: "Channels with upcoming programs", icon: Timer, tone: "text-info bg-info-soft" },
        { label: "Current time", value: clock, detail: data.display_timezone, icon: Clock },
      ]}
    />
  );
}
