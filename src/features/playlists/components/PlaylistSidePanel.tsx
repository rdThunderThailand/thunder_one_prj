"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { XIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { classifyApiError } from "@/lib/api/api-error";
import { fetchPlaylist } from "../services/playlists-api";
import { decodeMetadata, resolveCoverAssetId } from "../metadata";
import { playlistDisplayStatus, statusBadge } from "../status-display";
import type { PlaylistDetail, PlaylistListItem } from "../types";
import { ContentTab, DetailsTab, HistoryTab, ScheduleTab } from "./PlaylistPanelTabs";

export function PlaylistSidePanel({
  playlist,
  campaignName,
  busy,
  onClose,
  onDuplicate,
  onDelete,
}: {
  playlist: PlaylistListItem;
  campaignName?: string;
  busy: boolean;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  // Keyed by playlist id so a slow response for the previously selected row can never
  // render under this header — same guard the detail page uses.
  const [result, setResult] = useState<
    { id: string; detail: PlaylistDetail } | { id: string; error: string } | null
  >(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Extracted into a named function so the error branch can call it again for retry.
  // The result object is keyed by playlist.id, so the id guard at line 57 stays intact.
  const load = () => {
    let alive = true;
    fetchPlaylist(playlist.id)
      .then((detail) => alive && setResult({ id: playlist.id, detail }))
      .catch(
        (err) =>
          alive &&
          setResult({
            id: playlist.id,
            error: classifyApiError(err, "โหลดรายละเอียดไม่สำเร็จ").message,
          })
      );
    return () => {
      alive = false;
    };
  };

  useEffect(() => {
    return load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.id]);

  const current = result?.id === playlist.id ? result : null;
  const detail = current && "detail" in current ? current.detail : null;
  const error = current && "error" in current ? current.error : null;

  const coverId =
    playlist.cover_asset_id ??
    resolveCoverAssetId(decodeMetadata(playlist.metadata).info.coverAssetId, detail?.items ?? []);
  const previews = usePreviewUrls(useMemo(() => (coverId ? [coverId] : []), [coverId]));
  const badge = statusBadge(playlistDisplayStatus(playlist));

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {playlist.name}
          </h2>
          <Badge color={badge.color} variant="pill">
            {badge.label}
          </Badge>
        </div>
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <XIcon />
        </button>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <MediaThumb
          url={coverId ? previews.urls[coverId] : undefined}
          thumbnailUrl={coverId ? previews.thumbnailUrls[coverId] : undefined}
          alt={playlist.name}
          className="h-full w-full rounded-none"
        />
      </div>

      {error && (
        <div>
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              load();
            }}
            className="mt-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {!detail && !error ? (
        // Loading skeleton sized like the Details tab
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        detail && (
          <Tabs
            key={playlist.id}
            items={[
              {
                key: "details",
                label: "Details",
                content: <DetailsTab detail={detail} campaignName={campaignName} />,
              },
              {
                key: "schedule",
                label: "Schedule",
                content: <ScheduleTab playlistId={playlist.id} />,
              },
              {
                key: "content",
                label: `Content (${detail.items.length})`,
                content: <ContentTab detail={detail} />,
              },
              {
                key: "history",
                label: "History",
                content: <HistoryTab playlistId={playlist.id} />,
              },
            ]}
          />
        )
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Link
          href={`/playlists/create?id=${playlist.id}`}
          className={buttonClasses("secondary")}
        >
          Edit Playlist
        </Link>
        <Button variant="primary" disabled={busy} onClick={onDuplicate}>
          Duplicate
        </Button>
        {confirmingDelete ? (
          <>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-500 dark:bg-red-600"
              disabled={busy}
              onClick={onDelete}
            >
              {busy ? "กำลังลบ…" : "ยืนยันลบ?"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmingDelete(false)}>
              ไม่
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete
          </Button>
        )}
      </div>
    </aside>
  );
}
