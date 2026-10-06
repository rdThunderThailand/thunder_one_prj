"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ErrorState } from "@/components/ui/lovable/core";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { ApiError } from "@/lib/api/api-error";
import { ALL_CHANNELS, readChannelScope, writeChannelScope, type ChannelScope } from "../../../channels/channel-scope";
import { ChannelScopePicker } from "../../../channels/components/ChannelScopePicker";
import { fetchNowNext, type NowNextResponse } from "../../now-next";
import { formatClock } from "../../now-next-view";
import { NowNextKpiCards } from "./NowNextKpiCards";
import { NowPlayingTable } from "./NowPlayingTable";
import { UpNextTimeline } from "./UpNextTimeline";

const POLL_MS = 60_000;
const scopeKey = (scope: ChannelScope) => (scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`);

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NowNextPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<ChannelScope>(() => readChannelScope(searchParams));
  const [loaded, setLoaded] = useState<{ key: string; data: NowNextResponse } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const key = scopeKey(scope);

  useListUrlState(writeChannelScope(scope, new URLSearchParams()).toString(), () =>
    setScope(readChannelScope(new URLSearchParams(window.location.search))),
  );

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchNowNext(180, scope.kind !== "all", scope)
        .then((data) => {
          if (!alive) return;
          setLoaded({ key, data });
          setFailed(null);
        })
        .catch((error: unknown) => {
          if (!alive) return;
          // The scope's Channel or Group no longer exists: fall back to everything instead of a blank page.
          if (error instanceof ApiError && error.status === 404 && scope.kind !== "all") {
            setNotice(`That ${scope.kind === "group" ? "Channel Group" : "Channel"} no longer exists. Showing all Channels.`);
            setScope(ALL_CHANNELS);
            return;
          }
          setFailed({ key, message: "Could not load Now & Next. Try again in a moment." });
        });
    load();
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
  }, [scope, key]);

  const data = loaded?.key === key ? loaded.data : null;
  const error = failed?.key === key ? failed.message : null;
  const rows = data?.rows ?? [];
  const query = searchParams.toString();
  const calendarQuery = writeChannelScope(scope, new URLSearchParams()).toString();
  const returnTo = query ? `${pathname}?${query}` : pathname;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Now & Next"
        subtitle="See what is playing now and coming up on your Channels."
        titleInTopbar
        actions={
          <>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              Auto-refresh · as of {data ? formatClock(data.as_of, data.display_timezone) : "—"}
            </span>
            <ChannelScopePicker
              value={scope}
              onApply={(next) => {
                setNotice(null);
                setScope(next);
              }}
            />
          </>
        }
      />
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          {notice}
        </p>
      )}
      <NowNextKpiCards data={data} />
      <Panel
        title="Now Playing"
        subtitle="What each Channel is playing, and what follows"
        action={
          <div className="flex items-center gap-4">
            <Link
              href={`/media-workspace/calendar${calendarQuery ? `?${calendarQuery}` : ""}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open Calendar
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/media-workspace/channels"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all channels
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      >
        {error && <ErrorState description={error} />}
        {!error && !data && (
          <div className="flex flex-col gap-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {data && rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Nothing is playing or scheduled in the next 3 hours.</p>
        )}
        {data && rows.length > 0 && (
          <NowPlayingTable
            rows={rows}
            asOf={data.as_of}
            timeZone={data.display_timezone}
            returnTo={returnTo}
          />
        )}
      </Panel>
      {data && rows.length > 0 && (
        <UpNextTimeline
          rows={rows}
          asOf={data.as_of}
          timeZone={data.display_timezone}
        />
      )}
    </div>
  );
}
