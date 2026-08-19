import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { playlistDisplayStatus, statusBadge } from "../status-display";
import type { PlaylistDetail, PlaylistMetadata } from "../types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export function PlaylistProperties({
  detail,
  metadata,
  itemCount,
  totalDuration,
}: {
  detail: PlaylistDetail;
  metadata: PlaylistMetadata;
  itemCount: number;
  totalDuration: string;
}) {
  const badge = statusBadge(playlistDisplayStatus(detail));
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{detail.name}</h2>
        <Badge color={badge.color} variant="pill">
          {badge.label}
        </Badge>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <Row label="Playlist Type" value={metadata.info.playlistType ?? "—"} />
        <Row label="Items" value={itemCount} />
        <Row label="Total Duration" value={totalDuration} />
        <Row label="Resolution" value={metadata.info.resolution ?? "—"} />
        <Row label="Frame Rate" value={metadata.info.frameRate ? `${metadata.info.frameRate} fps` : "—"} />
        <Row label="Play Mode" value={metadata.playback.playMode ?? "—"} />
        <Row label="Repeat" value={metadata.playback.repeat ?? "—"} />
        <Row label="Transition" value={metadata.playback.defaultTransition ?? "—"} />
        <Row label="Media Fit" value={metadata.playback.mediaFit ?? "—"} />
        <Row label="Audio" value={metadata.playback.audioEnabled === false ? "Muted" : "On"} />
        {/* Not "Created At" — media_playlist_get doesn't return it (only media_playlists_list does). */}
        <Row label="Created By" value={detail.created_by?.display_name ?? "—"} />
      </div>
      {metadata.info.description && (
        <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {metadata.info.description}
        </p>
      )}
    </Card>
  );
}
