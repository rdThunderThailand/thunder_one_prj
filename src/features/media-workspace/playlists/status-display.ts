import type { PlaylistPermanentDeleteResult } from "@/lib/api/media-api";
import type { PlaylistStatus } from "./types";
import { mediaStatus, type MediaStatusEntry } from "../media-status.ts";

/** The only states a playlist shows and filters by (ADR 0125). */
export const PLAYLIST_DISPLAY_STATUSES = ["draft", "active"] as const;
export type PlaylistDisplayStatus = (typeof PLAYLIST_DISPLAY_STATUSES)[number];

/**
 * ADR 0125: a playlist is Draft or Active. Every non-draft playlist is Active, so Save & Activate
 * reads Active at once. Use is not a status: `in_use_count` (ADR 0120) drives a separate tag, and
 * a stored `inactive` row (no frontend caller writes it) displays as Active.
 */
export function playlistDisplayStatus(playlist: { status: PlaylistStatus }): PlaylistDisplayStatus {
  return playlist.status === "draft" ? "draft" : "active";
}

/** The neutral "in use" tag beside the badge (ADR 0125 decision 3); null when unused or the count is missing. */
export function playlistInUseLabel(playlist: { in_use_count?: number }): string | null {
  return playlist.in_use_count ? `ใช้ใน ${playlist.in_use_count} Program` : null;
}

export function statusBadge(status: PlaylistStatus): MediaStatusEntry {
  return mediaStatus(status);
}

/**
 * `media_playlist_permanent_delete` answers `{deleted:false}` with a reason (ADR 0121): `published`
 * (a Program ever pointed at it) or `in_layout` (a Layout zone still holds it, `layouts` names them).
 * A Layout in Trash must be restored before it can drop the playlist, so that is said next to it.
 */
export function describePermanentDeleteRefusal(result: Pick<PlaylistPermanentDeleteResult, "reason" | "layouts">): string {
  if (result.reason === "published") {
    return "ลบถาวรไม่ได้ — playlist นี้เคยถูก publish จึงถูกล็อกไว้ถาวร";
  }
  if (result.reason === "in_layout" && result.layouts?.length) {
    const names = result.layouts
      .map((layout) => (layout.in_trash ? `${layout.name} (ในถังขยะ — กู้คืน Layout ก่อน)` : layout.name))
      .join(", ");
    return `ลบถาวรไม่ได้ — playlist นี้ยังอยู่ใน Layout: ${names} เอาออกจาก Layout ก่อน`;
  }
  return "ลบถาวรไม่ได้ กรุณาลองใหม่อีกครั้ง";
}
