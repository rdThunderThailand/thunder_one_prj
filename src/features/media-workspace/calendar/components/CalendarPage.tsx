"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ErrorState } from "@/components/ui/lovable/core";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { ApiError } from "@/lib/api/api-error";
import { ALL_CHANNELS, type ChannelScope } from "../../channels/channel-scope";
import { fetchCalendar, type CalendarResponse } from "../calendar-api";
import { dayRange, todayYmd } from "../calendar-day";
import { readCalendarUrl, writeCalendarUrl, type CalendarUrlState } from "../calendar-url";
import { blockKey, CalendarGrid } from "./CalendarGrid";
import { CalendarQuickView } from "./CalendarQuickView";
import { CalendarToolbar } from "./CalendarToolbar";

const POLL_MS = 60_000;
const stateKey = ({ date, scope }: CalendarUrlState) => `${date}|${scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`}`;

export function CalendarPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CalendarUrlState>(() => readCalendarUrl(searchParams));
  const [loaded, setLoaded] = useState<{ key: string; data: CalendarResponse } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ key: string; blockKey: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const key = stateKey(state);
  const { date, scope } = state;
  const qs = writeCalendarUrl(state).toString();

  useListUrlState(qs, () => setState(readCalendarUrl(new URLSearchParams(window.location.search))));

  useEffect(() => {
    let alive = true;
    const { from, to } = dayRange(date);
    const load = () =>
      fetchCalendar(from, to, scope)
        .then((data) => {
          if (!alive) return;
          setLoaded({ key, data });
          setFailed(null);
          setNow(Date.now());
        })
        .catch((error: unknown) => {
          if (!alive) return;
          // The scope's Channel or Group no longer exists: fall back to everything instead of a blank page.
          if (error instanceof ApiError && error.status === 404 && scope.kind !== "all") {
            setNotice(`That ${scope.kind === "group" ? "Channel Group" : "Channel"} no longer exists. Showing all Channels.`);
            setState((current) => ({ ...current, scope: ALL_CHANNELS }));
            return;
          }
          setFailed({ key, message: "Could not load the Calendar. Try again in a moment." });
        });
    load();
    // Only today moves; other days are static until the operator edits a Program (ADR 0085 §6).
    if (date !== todayYmd()) return () => void (alive = false);
    const poll = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [date, scope, key]);

  const data = loaded?.key === key ? loaded.data : null;
  const error = failed?.key === key ? failed.message : null;
  const rows = data?.rows ?? [];
  const selectedKey = selection?.key === key ? selection.blockKey : null;
  const selected = rows
    .flatMap((row) => row.segments.map((segment) => ({ row, segment })))
    .find(({ row, segment }) => blockKey(row, segment) === selectedKey);
  const returnTo = `/media-workspace/calendar${qs ? `?${qs}` : ""}`;

  const changeDate = (next: string) => setState((current) => ({ ...current, date: next }));
  const changeScope = (next: ChannelScope) => {
    setNotice(null);
    setState((current) => ({ ...current, scope: next }));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Calendar"
        subtitle="View and manage scheduled Programs across your Channels."
        titleInTopbar
        actions={
          <Button
            asChild
            size="sm"
          >
            <Link href="/media-workspace/program/create">
              <PlusIcon className="h-4 w-4" />
              Create Program
            </Link>
          </Button>
        }
      />
      <CalendarToolbar
        date={date}
        scope={scope}
        onDate={changeDate}
        onScope={changeScope}
      />
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          {notice}
        </p>
      )}
      {date < todayYmd() && (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Past days show the current schedule, not what actually played — see Playback Proof.
        </p>
      )}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        {error && <ErrorState description={error} />}
        {!error && !data && (
          <div className="flex flex-col gap-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {data && rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No Programs are scheduled on this day.</p>
        )}
        {data && rows.length > 0 && (
          <CalendarGrid
            rows={rows}
            date={date}
            now={now}
            selectedKey={selectedKey}
            onSelect={(next) => setSelection({ key, blockKey: next })}
          />
        )}
      </section>
      {selected && (
        <CalendarQuickView
          row={selected.row}
          segment={selected.segment}
          date={date}
          now={now}
          returnTo={returnTo}
        />
      )}
    </div>
  );
}
