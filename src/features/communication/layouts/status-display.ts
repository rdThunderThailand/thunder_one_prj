import type { BadgeColor } from "@/components/ui/Badge";
import type { LayoutStatus } from "./types";

/** Unlike Playlist (ADR 0028), a Layout's status is never derived — it is the stored
 *  column directly, active ↔ inactive with no hard delete (ADR 0044 §6). */
export function statusBadge(status: LayoutStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  return { color: "zinc", label: "Inactive" };
}

/**
 * `media_layout_upsert` raises the exact wordings below (Thunder_Core migration
 * 20260825094420_layouts.sql). Anything unrecognised degrades to a generic retry
 * message rather than leaking the raw RPC/Postgres text (CLAUDE.md §8).
 */
export function describeSaveError(message: string): string {
  if (message.includes("more than 4 zones")) {
    return "บันทึกไม่ได้ — Layout มีได้สูงสุด 4 Zone";
  }
  if (message.includes("at least one zone")) {
    return "บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone";
  }
  if (message.includes("overlap")) {
    return "บันทึกไม่ได้ — Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่";
  }
  if (message.includes("Already exists") || /duplicate key|unique constraint/i.test(message)) {
    return "บันทึกไม่ได้ — มี Layout ชื่อนี้อยู่แล้ว";
  }
  return "บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}
