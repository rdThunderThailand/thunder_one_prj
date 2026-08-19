"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { MoreIcon } from "@/components/ui/icons";
import {
  classifyPublicationAiring,
  fetchPublication,
  fetchPublications,
  formatScheduleStart,
  type PublicationDetail,
  type PublicationListItem,
} from "@/features/publications";

/**
 * Channel and start time only exist on the detail payload, so this card is a 1+N
 * read: one list call, then one detail call per publication.
 *
 * ponytail: N is the number of *active* publications — a handful. Move the
 * derived fields into media_publications_list if that stops being true.
 */
type Loaded = { list: PublicationListItem; detail: PublicationDetail };

type Row = {
  id: string;
  name: string;
  itemCount: number;
  campaign: string;
  channelLabel: string;
  channelExtra: number;
  channelTitle: string;
  startTime: string;
  isLive: boolean;
};

function toRow(item: Loaded, now: Date, isLive: boolean): Row {
  const names = (item.detail.publication_targets ?? [])
    .map((t) => t.name)
    .filter((n): n is string => !!n);

  return {
    id: item.list.id,
    name: item.list.name,
    itemCount: item.list.item_count ?? 0,
    campaign: item.list.campaign_name || "—",
    channelLabel: names[0] ?? "—",
    channelExtra: names.length > 1 ? names.length - 1 : 0,
    channelTitle: names.join(", "),
    startTime: formatScheduleStart(item.detail.schedule, now),
    isLive,
  };
}

function PublicationTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-400">{empty}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-xs text-zinc-400">
          <th className="pb-2 font-medium">Publication</th>
          <th className="pb-2 font-medium">Campaign</th>
          <th className="pb-2 font-medium">Channel</th>
          <th className="pb-2 font-medium">Status</th>
          <th className="pb-2 font-medium">Start Time</th>
          <th className="pb-2 font-medium" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
            <td className="py-2.5 pr-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {row.name[0]}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/publications/${row.id}`}
                    className="truncate font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                  >
                    {row.name}
                  </Link>
                  <p className="text-xs text-zinc-400">{row.itemCount} รายการ</p>
                </div>
              </div>
            </td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{row.campaign}</td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
              <span className="truncate">{row.channelLabel}</span>
              {row.channelExtra > 0 && (
                <span
                  className="ml-1 rounded bg-zinc-100 px-1 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  title={row.channelTitle}
                >
                  +{row.channelExtra}
                </span>
              )}
            </td>
            <td className="py-2.5 pr-3">
              <Badge variant="pill" color={row.isLive ? "green" : "blue"}>
                {row.isLive ? "Live" : "Scheduled"}
              </Badge>
            </td>
            <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{row.startTime}</td>
            <td className="py-2.5 text-right">
              <button
                className="text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="More actions"
                disabled
                title="Not built yet"
              >
                <MoreIcon />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NowNextPublicationsCard() {
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Liveness is a function of the clock, so re-derive it on a timer. Pure
  // recomputation from data we already hold — no refetch.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const list = await fetchPublications("active");
        const settled = await Promise.allSettled(list.map((p) => fetchPublication(p.id)));
        if (!alive) return;

        const ok: Loaded[] = [];
        let failed = 0;
        settled.forEach((result, i) => {
          if (result.status === "fulfilled") ok.push({ list: list[i], detail: result.value });
          else failed += 1;
        });
        setLoaded(ok);
        setFailedCount(failed);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "โหลด publication ไม่สำเร็จ");
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const live: Row[] = [];
  const next: Row[] = [];
  // Anything we cannot place: a detail call that failed, or one with no schedule.
  // Guessing a bucket would make the card's own headline a lie, so it is reported
  // instead. Publications whose window has ended are dropped on purpose — the
  // backend never moves them off 'active'.
  let unknown = failedCount;

  for (const item of loaded ?? []) {
    const state = classifyPublicationAiring(item.detail.schedule, now);
    if (state === "live") live.push(toRow(item, now, true));
    else if (state === "next") next.push(toRow(item, now, false));
    else if (state === null) unknown += 1;
  }

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Now &amp; Next Publications
        </h2>
        <Link
          href="/publications"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all
        </Link>
      </div>

      {error ? (
        <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : loaded === null ? (
        <p className="py-6 text-center text-sm text-zinc-400">กำลังโหลด publication…</p>
      ) : (
        <>
          <Tabs
            items={[
              {
                key: "now",
                label: `Now Live (${live.length})`,
                content: (
                  <PublicationTable
                    rows={live}
                    empty="ไม่มี publication ที่ออกอากาศอยู่"
                  />
                ),
              },
              {
                key: "next",
                label: `Next Up (${next.length})`,
                content: (
                  <PublicationTable
                    rows={next}
                    empty="ไม่มี publication ที่ตั้งเวลาไว้"
                  />
                ),
              },
            ]}
          />
          {unknown > 0 && (
            <p className="pt-2 text-xs text-amber-600 dark:text-amber-500">
              {unknown} รายการไม่ทราบสถานะการออกอากาศ — โหลดหน้าใหม่เพื่อลองอีกครั้ง
            </p>
          )}
        </>
      )}
    </Card>
  );
}
