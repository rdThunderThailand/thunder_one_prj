"use client";

// The three data-backed tabs of the playlist side panel, split out to keep the panel
// itself readable.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPublications } from "@/features/media-workspace/publications/services/publications-api";
import type { PublicationListItem } from "@/features/media-workspace/publications/types";
import {
  isPastPublication,
  publicationDisplayStatus,
  publicationStatusColor,
} from "@/features/media-workspace/publications/publication-status";
import { decodeMetadata } from "../metadata";
import { resolutionLabel } from "../output-profile";
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
      <Row
        label="Start Playback From"
        value={metadata.playback.startFrom === "resume" ? "Resume last successful item" : "First item"}
      />
      <Row label="Resolution" value={resolutionLabel(metadata.info.resolution)} />
      <Row label="Created By" value={detail.created_by?.display_name ?? "—"} />
      {metadata.info.description && (
        <p className="pt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {metadata.info.description}
        </p>
      )}
    </div>
  );
}

/** Compact enough for a 380px column — resolution and file-size columns have nowhere
 *  to go here. */
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
 *  that point at it, so these tabs list those, split into what's live and what's past
 *  (ADR 0015). Loaded only when a tab is first opened.
 *  ponytail: no dates — the publications list carries no starts_at, that would need one
 *  detail call per publication. */
const PER_PAGE = 5;

function usePlaylistPublications(playlistId: string) {
  const [publications, setPublications] = useState<PublicationListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

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

  return { publications, failed };
}

function PageNav({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-zinc-400">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
      >
        ก่อนหน้า
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
      >
        ถัดไป
      </button>
    </div>
  );
}

function PublicationRow({ publication }: { publication: PublicationListItem }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 p-2 dark:border-zinc-800">
      <Link
        href={`/media-workspace/publications/${publication.id}`}
        className="min-w-0 flex-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {publication.name}
      </Link>
      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
        {publication.campaign_name ?? "—"}
      </span>
      <Badge color={publicationStatusColor(publication.effective_status ?? publication.status)} variant="pill">
        {publicationDisplayStatus(publication)}
      </Badge>
    </li>
  );
}

const SCHEDULE_STATUS_RANK: Record<string, number> = { active: 0, scheduled: 1, draft: 2 };

export function ScheduleTab({ playlistId }: { playlistId: string }) {
  const { publications, failed } = usePlaylistPublications(playlistId);
  const [page, setPage] = useState(1);

  if (failed) {
    return <p className="py-8 text-center text-sm text-zinc-400">โหลดตารางเวลาไม่สำเร็จ</p>;
  }
  if (publications === null) {
    return <p className="py-8 text-center text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  const live = publications.filter((p) => !isPastPublication(p));
  if (live.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        ยังไม่มี publication ที่กำลังใช้ playlist นี้
      </p>
    );
  }

  // active first, then scheduled, then draft — status the operator most needs to act
  // on floats to the top.
  const sorted = [...live].sort(
    (a, b) =>
      (SCHEDULE_STATUS_RANK[a.effective_status ?? a.status] ?? 3) -
      (SCHEDULE_STATUS_RANK[b.effective_status ?? b.status] ?? 3)
  );
  const { rows, totalPages, page: current } = paginate(sorted, page, PER_PAGE);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((publication) => (
          <PublicationRow key={publication.id} publication={publication} />
        ))}
      </ul>
      <PageNav page={current} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export function HistoryTab({ playlistId }: { playlistId: string }) {
  const { publications, failed } = usePlaylistPublications(playlistId);
  const [page, setPage] = useState(1);

  if (failed) {
    return <p className="py-8 text-center text-sm text-zinc-400">โหลดประวัติไม่สำเร็จ</p>;
  }
  if (publications === null) {
    return <p className="py-8 text-center text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  const past = publications.filter(isPastPublication);
  if (past.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">ยังไม่มี publication ที่จบไปแล้ว</p>
    );
  }

  // ล่าสุดก่อน
  const sorted = [...past].sort(
    (a, b) =>
      new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
      new Date(a.updated_at ?? a.created_at ?? 0).getTime()
  );
  const { rows, totalPages, page: current } = paginate(sorted, page, PER_PAGE);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((publication) => (
          <PublicationRow key={publication.id} publication={publication} />
        ))}
      </ul>
      <PageNav page={current} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
