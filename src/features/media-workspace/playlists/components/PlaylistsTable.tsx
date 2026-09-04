"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { EditIcon, MoreIcon, PlayIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { decodeMetadata } from "../metadata";
import { formatDuration } from "../duration";
import { playlistContentType, type Sort, type SortKey } from "../list-filtering";
import { playlistDisplayStatus, statusBadge } from "../status-display";
import type { PlaylistListItem } from "../types";

/** "14 May 2025 10:30" — the list is client-rendered after its fetch, so the browser's
 *  own formatting never has server HTML to mismatch against. */
function formatUpdatedAt(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function coverAssetId(playlist: PlaylistListItem): string | undefined {
  return playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;
}

export type RowAction = "duplicate" | "delete" | "mark-ready" | "move" | "tags" | "restore" | "permanent-delete";

const TYPE_LABELS: Record<"video" | "image" | "mixed", string> = {
  video: "Video",
  image: "Image",
  mixed: "Mixed",
};

export function PlaylistsTable({
  rows,
  busyId,
  sort,
  inTrash = false,
  onAction,
  onSortChange,
}: {
  rows: PlaylistListItem[];
  busyId: string | null;
  sort: Sort;
  inTrash?: boolean;
  onAction: (action: RowAction, playlist: PlaylistListItem) => void;
  onSortChange: (key: SortKey) => void;
}) {
  // One signing call for every cover on the page, not one per row.
  const coverIds = useMemo(
    () => [...new Set(rows.map(coverAssetId).filter((id): id is string => !!id))],
    [rows]
  );
  const previews = usePreviewUrls(coverIds);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <SortHeader label="Playlist Name" sortKey="name" sort={sort} onSortChange={onSortChange} className="py-2 pl-1" />
            <SortHeader label="Type" sortKey="type" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Duration" sortKey="duration" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Status" sortKey="status" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Last Updated" sortKey="updated" sort={sort} onSortChange={onSortChange} className="py-2" />
            <th className="py-2 pr-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((playlist) => {
            const cover = coverAssetId(playlist);
            const badge = statusBadge(playlistDisplayStatus(playlist));

            return (
              <tr
                key={playlist.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="py-3 pl-1">
                  <div className="flex items-center gap-3">
                    <MediaThumb
                      url={cover ? previews.urls[cover] : undefined}
                      alt={playlist.name}
                      className="h-10 w-14"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {playlist.name}
                      </p>
                      {playlist.created_by?.display_name && (
                        <p className="truncate text-xs text-zinc-400">
                          By {playlist.created_by.display_name}
                        </p>
                      )}
                      {playlist.tags && playlist.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {playlist.tags.map((tag) => (
                            <Badge key={tag.id} color="zinc" variant="pill">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {(() => {
                    const type = playlistContentType(playlist);
                    return type ? TYPE_LABELS[type] : "—";
                  })()}
                </td>
                <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {playlist.total_duration_seconds == null
                    ? "—"
                    : formatDuration(playlist.total_duration_seconds)}
                </td>
                <td className="py-3">
                  <Badge color={badge.color} variant="pill">
                    {badge.label}
                  </Badge>
                </td>
                <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatUpdatedAt(playlist.updated_at ?? playlist.created_at)}
                </td>
                <td className="py-3 pr-1 text-right">
                  <RowActions
                    playlist={playlist}
                    isDraft={playlist.status === "draft"}
                    inTrash={inTrash}
                    canPermanentDelete={(playlist.publication_count ?? 0) === 0}
                    disabled={busyId === playlist.id}
                    onAction={(action) => onAction(action, playlist)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSortChange: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {label}
        {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

// ponytail: native <details> menu — no outside-click dismiss, no positioning library.
// Swap to the popover API if the open menu ever gets in the way.
function RowActions({
  playlist,
  isDraft,
  inTrash,
  canPermanentDelete,
  disabled,
  onAction,
}: {
  playlist: PlaylistListItem;
  isDraft: boolean;
  inTrash: boolean;
  canPermanentDelete: boolean;
  disabled: boolean;
  onAction: (action: RowAction) => void;
}) {
  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800";
  const danger = `${item} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`;

  return (
    <div className="flex items-center justify-end gap-2">
      {!inTrash && (
        <>
          <Link
            href={`/media-workspace/preview/playlist/${playlist.id}`}
            aria-label={`Preview ${playlist.name}`}
            title="Preview"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            <PlayIcon />
          </Link>
          <Link
            href={`/media-workspace/playlists/${playlist.id}`}
            aria-label={`Edit ${playlist.name}`}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            <EditIcon />
          </Link>
        </>
      )}
      <details
        className="relative inline-block text-left"
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            e.currentTarget.removeAttribute("open");
          }
        }}
      >
        <summary
          aria-label={`More actions for ${playlist.name}`}
          role="button"
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            const details = event.currentTarget.parentElement as HTMLDetailsElement | null;
            if (details) details.open = !details.open;
          }}
          className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <MoreIcon />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        {inTrash ? (
          <>
            <button type="button" className={item} disabled={disabled} onClick={() => onAction("restore")}>
              Restore
            </button>
            {/* #40: a playlist that has ever been published can never be permanently
                deleted (publications.playlist_id is ON DELETE RESTRICT) — explain it
                rather than offer a button that always fails. */}
            {canPermanentDelete ? (
              <button type="button" className={danger} disabled={disabled} onClick={() => onAction("permanent-delete")}>
                Delete permanently
              </button>
            ) : (
              <p className="px-3 py-1.5 text-xs text-zinc-400">
                Can&rsquo;t delete permanently — this playlist has been published.
              </p>
            )}
          </>
        ) : (
          <>
            {/* The one stored status transition (ADR 0060 §3, §6) — draft rows only, and it
                moves the badge to Inactive, not Active, until a publication references it. */}
            {isDraft && (
              <button type="button" className={item} disabled={disabled} onClick={() => onAction("mark-ready")}>
                Mark as ready
              </button>
            )}
            <button type="button" className={item} disabled={disabled} onClick={() => onAction("duplicate")}>
              Duplicate
            </button>
            <button type="button" className={item} disabled={disabled} onClick={() => onAction("move")}>
              Move to folder…
            </button>
            <button type="button" className={item} disabled={disabled} onClick={() => onAction("tags")}>
              Edit tags…
            </button>
            <button type="button" className={danger} disabled={disabled} onClick={() => onAction("delete")}>
              Move to Trash
            </button>
          </>
        )}
        </div>
      </details>
    </div>
  );
}
