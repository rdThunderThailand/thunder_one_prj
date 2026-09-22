import type { BadgeColor } from "@/components/ui/Badge";
import type { PlaylistStatus } from "./types";

/**
 * ADR 0028: active means "referenced by at least one publication (any status)",
 * inactive means "finished but referenced by none". The stored `status` column
 * defaults to 'active' and is never written as 'inactive', so it only still means
 * draft / not-draft. A missing `publication_count` (backend not deployed yet) falls
 * back to the stored value rather than claiming everything is inactive.
 */
export function playlistDisplayStatus(playlist: {
  status: PlaylistStatus;
  publication_count?: number;
}): PlaylistStatus {
  if (playlist.status === "draft") return "draft";
  if (playlist.publication_count === undefined) return playlist.status;
  return playlist.publication_count > 0 ? "active" : "inactive";
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
