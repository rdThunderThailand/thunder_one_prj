"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { EditIcon, MoreIcon, PlayIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { decodeMetadata } from "../metadata";
import { formatDuration } from "../duration";
import { playlistContentType, type Sort, type SortKey } from "../list-filtering";
import { playlistDisplayStatus, statusBadge } from "../status-display";
import type { PlaylistListItem } from "../types";

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
const statusVariant = (color: string) => color === "green" ? "success" : color === "yellow" ? "warning" : "neutral";

export function PlaylistsTable({
  rows,
  busyId,
  sort,
  inTrash = false,
  onAction,
  onSortChange,
  selectedIds,
  onSelectionChange,
}: {
  rows: PlaylistListItem[];
  busyId: string | null;
  sort: Sort;
  inTrash?: boolean;
  onAction: (action: RowAction, playlist: PlaylistListItem) => void;
  onSortChange: (key: SortKey) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}) {
  const coverIds = useMemo(
    () => [...new Set(rows.map(coverAssetId).filter((id): id is string => !!id))],
    [rows]
  );
  const previews = usePreviewUrls(coverIds);
  const isAllSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[10px]">
        <thead>
          <tr className="border-b border-border text-[9px] font-semibold text-muted-foreground">
            <th className="w-8 py-2 pl-2"><Checkbox aria-label="Select all playlists on this page" checked={isAllSelected} onCheckedChange={(value) => onSelectionChange(value === true ? new Set(rows.map((row) => row.id)) : new Set())} /></th>
            <SortHeader label="Playlist" sortKey="name" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Type" sortKey="type" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Duration" sortKey="duration" sort={sort} onSortChange={onSortChange} className="py-2" />
            <th className="py-2">Items</th>
            <SortHeader label="Last Modified" sortKey="updated" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Status" sortKey="status" sort={sort} onSortChange={onSortChange} className="py-2" />
            <th className="py-2 pr-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((playlist) => {
            const cover = coverAssetId(playlist);
            const badge = statusBadge(playlistDisplayStatus(playlist));
            const metadata = decodeMetadata(playlist.metadata);

            return (
              <tr
                key={playlist.id}
                className="border-b border-border last:border-0 hover:bg-muted"
              >
                <td className="py-3 pl-2"><Checkbox aria-label={`Select ${playlist.name}`} checked={selectedIds.has(playlist.id)} onCheckedChange={(value) => { const next = new Set(selectedIds); if (value === true) next.add(playlist.id); else next.delete(playlist.id); onSelectionChange(next); }} /></td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <MediaThumb
                      url={cover ? previews.urls[cover] : undefined}
                      alt={playlist.name}
                      className="h-10 w-14"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold text-foreground">
                        {playlist.name}
                      </p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {metadata.info.description || "No description"}
                      </p>
                      {playlist.created_by?.display_name && (
                        <p className="truncate text-[8px] text-muted-foreground">
                          By {playlist.created_by.display_name}
                        </p>
                      )}
                      {playlist.tags && playlist.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {playlist.tags.map((tag) => (
                            <Badge key={tag.id} variant="neutral" className="rounded-full px-2 py-0 text-[8px]">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-medium">{(() => {
                    const type = playlistContentType(playlist);
                    return type ? TYPE_LABELS[type] : "—";
                  })()}</Badge>
                </td>
                <td className="py-3 text-[10px] text-muted-foreground">
                  {playlist.total_duration_seconds == null
                    ? "—"
                    : formatDuration(playlist.total_duration_seconds)}
                </td>
                <td className="py-3 text-[10px] text-muted-foreground">
                  {playlist.item_count.toLocaleString()}
                </td>
                <td className="py-3 text-[10px] text-muted-foreground">
                  {playlist.created_by?.display_name && <span className="block">by {playlist.created_by.display_name}</span>}
                  {formatUpdatedAt(playlist.updated_at ?? playlist.created_at)}
                </td>
                <td className="py-3">
                  <Badge variant={statusVariant(badge.color)} className="rounded-full px-2 py-0 text-[9px]">{badge.label}</Badge>
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
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

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
    "block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted";
  const danger = `${item} text-danger hover:bg-danger-soft`;

  return (
    <div className="flex items-center justify-end gap-2">
      {!inTrash && (
        <>
          <Link
            href={`/media-workspace/preview/playlist/${playlist.id}`}
            aria-label={`Preview ${playlist.name}`}
            title="Preview"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"
          >
            <PlayIcon />
          </Link>
          <Link
            href={`/media-workspace/playlists/${playlist.id}`}
            aria-label={`Edit ${playlist.name}`}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"
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
          className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreIcon />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
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
              <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
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
