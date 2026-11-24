import type { PlaylistPermanentDeleteResult } from "@/lib/api/media-api";
import type { PlaylistStatus } from "./types";

type BadgeColor = "green" | "yellow" | "zinc";

/**
 * ADR 0120 (supersedes the count in ADR 0028): active means "a draft or active Program plays
 * it, directly or through a Layout zone" (`in_use_count`), inactive means "finished and not in
 * use". The stored `status` column defaults to 'active' and is never written as 'inactive', so
 * it only still means draft / not-draft. A missing `in_use_count` (backend not deployed yet)
 * falls back to the stored value rather than claiming everything is inactive.
 */
export function playlistDisplayStatus(playlist: {
  status: PlaylistStatus;
  in_use_count?: number;
}): PlaylistStatus {
  if (playlist.status === "draft") return "draft";
  if (playlist.in_use_count === undefined) return playlist.status;
  return playlist.in_use_count > 0 ? "active" : "inactive";
}

/** Draft is yellow rather than zinc so it reads as in-progress, not switched off. */
export function statusBadge(status: PlaylistStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  if (status === "draft") return { color: "yellow", label: "Draft" };
  return { color: "zinc", label: "Inactive" };
}

/**
 * `media_playlist_delete` (Thunder_Core #40) refuses "Move to Trash" while a `draft` or
 * `active` publication points at the playlist, with the raw wording
 * "Invalid input: playlist is used by an active or draft publication: Name A, Name B".
 * The names are the useful part; the prefix must not reach the user.
 */
export function describeDeleteError(message: string): string {
  const named = /used by an active or draft publication: (.+)$/.exec(message);
  if (named) {
    return `ย้ายลงถังไม่ได้ — playlist นี้ถูกใช้อยู่ใน publication ที่ active หรือ draft: ${named[1]} กรุณายกเลิก publication เหล่านั้นก่อน`;
  }
  // Legacy wording, kept until every environment is on the #40 backend.
  const used = /used by (\d+) publication/.exec(message);
  if (used) {
    return `ลบไม่ได้ — playlist นี้ถูกใช้อยู่ใน ${used[1]} publication กรุณาลบหรือยกเลิก publication เหล่านั้นก่อน`;
  }
  if (message.includes("belongs to a publication")) {
    return "ลบไม่ได้ — playlist นี้ถูกสร้างโดย publication ให้ลบที่ publication แทน";
  }
  // media_video_delete (ADR 0045 §10) raises "Already in use: ..." when the wrapper
  // playlist's video Asset can't be hard-deleted — reachable via the kind='single' cascade.
  if (message.startsWith("Already in use:")) {
    if (message.includes("referenced by a playlist")) {
      return "ลบไม่ได้ — วิดีโอนี้ยังถูกใช้อยู่ใน playlist กรุณานำออกจาก playlist ก่อน";
    }
    return "ลบไม่ได้ — วิดีโอนี้เคย publish ไปแล้วจึงลบถาวรไม่ได้ ใช้ Archive แทน";
  }
  return "ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
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
