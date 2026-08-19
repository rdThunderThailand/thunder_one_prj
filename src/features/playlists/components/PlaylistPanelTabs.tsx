"use client";

// The three data-backed tabs of the playlist side panel, split out to keep the panel
// itself readable.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPublications } from "@/features/publications/services/publications-api";
import type { PublicationListItem } from "@/features/publications/types";
import { decodeMetadata } from "../metadata";
import { formatDuration, totalDurationSeconds } from "../duration";
import { paginate } from "../list-filtering";
import type { PlaylistDetail } from "../types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export function DetailsTab({
  detail,
  campaignName,
}: {
  detail: PlaylistDetail;
  campaignName?: string;
}) {
  const metadata = decodeMetadata(detail.metadata);
  const duration = formatDuration(
    totalDurationSeconds(
      detail.items.map((i) => ({
        mediaAssetId: i.media_asset_id,
        durationSeconds: i.duration_seconds ?? null,
      }))
    )
  );

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      <Row label="Playlist Type" value={metadata.info.playlistType ?? "—"} />
      <Row label="Campaign" value={campaignName ?? "—"} />
      <Row label="Items" value={detail.items.length} />
      <Row label="Duration" value={duration} />
      <Row label="Play Mode" value={metadata.playback.playMode ?? "—"} />
      <Row label="Resolution" value={metadata.info.resolution ?? "—"} />
      <Row label="Created By" value={detail.created_by?.display_name ?? "—"} />
      {metadata.info.tags && metadata.info.tags.length > 0 && (
        <Row
          label="Tags"
          value={
            <span className="flex flex-wrap justify-end gap-1">
              {metadata.info.tags.map((tag) => (
                <Badge key={tag} color="zinc" variant="pill">
                  {tag}
                </Badge>
              ))}
            </span>
          }
        />
      )}
      {metadata.info.description && (
        <p className="pt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {metadata.info.description}
        </p>
      )}
    </div>
  );
}

/** Compact enough for a 380px column — the detail page's PlaylistItemsTable carries
 *  resolution and file size columns that have nowhere to go here. */
export function ContentTab({ detail }: { detail: PlaylistDetail }) {
  const items = useMemo(
    () => [...detail.items].sort((a, b) => a.position - b.position),
    [detail.items]
  );
  const previews = usePreviewUrls(useMemo(() => items.map((i) => i.media_asset_id), [items]));

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">Playlist นี้ยังไม่มีสื่อ</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={`${item.media_asset_id}-${item.position}`} className="flex items-center gap-3">
          <span className="w-4 text-xs text-zinc-400">{index + 1}</span>
          <MediaThumb
            url={previews.urls[item.media_asset_id]}
            thumbnailUrl={previews.thumbnailUrls[item.media_asset_id]}
            alt={item.title ?? "media"}
            className="h-9 w-12"
          />
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
            {item.title ?? item.media_asset_id.slice(0, 8)}
          </span>
          <span className="text-xs text-zinc-400">
            {item.duration_seconds != null ? `${item.duration_seconds}s` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A playlist has no schedule of its own (ADR 0011) — what it has is the publications
 *  that point at it, so this lists those. Loaded only when the tab is first opened.
 *  ponytail: no dates — the publications list carries no starts_at, that would need one
 *  detail call per publication. */
const SCHEDULE_STATUS_RANK: Record<string, number> = { active: 0, draft: 1 };
const SCHEDULE_PER_PAGE = 5;

export function ScheduleTab({ playlistId }: { playlistId: string }) {
  const [publications, setPublications] = useState<PublicationListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchPublications("draft"),
      fetchPublications("active"),
      fetchPublications("cancelled"),
    ])
      .then((lists) => {
        if (!alive) return;
        setPublications(lists.flat().filter((p) => p.playlist_id === playlistId));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [playlistId]);

  if (failed) {
    return <p className="py-8 text-center text-sm text-zinc-400">โหลดตารางเวลาไม่สำเร็จ</p>;
  }
  if (publications === null) {
    return <p className="py-8 text-center text-sm text-zinc-400">กำลังโหลด...</p>;
  }
  if (publications.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        ยังไม่มี publication ที่ใช้ playlist นี้
      </p>
    );
  }

  // active first, then draft, then anything else (cancelled) — status the operator most
  // needs to act on floats to the top.
  const sorted = [...publications].sort(
    (a, b) => (SCHEDULE_STATUS_RANK[a.status] ?? 2) - (SCHEDULE_STATUS_RANK[b.status] ?? 2)
  );
  const { rows, totalPages, page: current } = paginate(sorted, page, SCHEDULE_PER_PAGE);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((publication) => (
          <li
            key={publication.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 p-2 dark:border-zinc-800"
          >
            <Link
              href={`/publications/${publication.id}`}
              className="min-w-0 flex-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {publication.name}
            </Link>
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {publication.campaign_name ?? "—"}
            </span>
            <Badge color="zinc" variant="pill">
              {publication.effective_status ?? publication.status}
            </Badge>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
          >
            ก่อนหน้า
          </button>
          <span>
            {current} / {totalPages}
          </span>
          <button
            type="button"
            disabled={current >= totalPages}
            onClick={() => setPage(current + 1)}
            className="rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
