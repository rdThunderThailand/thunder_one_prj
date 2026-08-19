import type { BadgeColor } from "@/components/ui/Badge";
import type { PlaylistStatus } from "./types";

/** Draft is yellow rather than zinc so it reads as in-progress, not switched off. */
export function statusBadge(status: PlaylistStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  if (status === "draft") return { color: "yellow", label: "Draft" };
  return { color: "zinc", label: "Inactive" };
}

/**
 * `media_playlist_delete` (Thunder_Core migration 097) refuses with the raw wording
 * "Invalid input: playlist is used by 3 publication(s)". The count is the only useful
 * part; the rest must not reach the user.
 */
export function describeDeleteError(message: string): string {
  const used = /used by (\d+) publication/.exec(message);
  if (used) {
    return `ลบไม่ได้ — playlist นี้ถูกใช้อยู่ใน ${used[1]} publication กรุณาลบหรือยกเลิก publication เหล่านั้นก่อน`;
  }
  if (message.includes("belongs to a publication")) {
    return "ลบไม่ได้ — playlist นี้ถูกสร้างโดย publication ให้ลบที่ publication แทน";
  }
  return "ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}
