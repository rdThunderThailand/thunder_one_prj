import type { BadgeColor } from "@/components/ui/Badge";
import type { CompositionStatus } from "./types";

/** draft → active ↔ inactive, copied from Playlist's lifecycle (ADR 0049 §10). */
export function statusBadge(status: CompositionStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  if (status === "draft") return { color: "yellow", label: "Draft" };
  return { color: "zinc", label: "Inactive" };
}

/**
 * `media_composition_upsert` / `media_composition_set_zones` / `media_composition_set_status`
 * raise the exact wordings below (Thunder_Core migration 20260826120000). Anything unrecognised
 * degrades to a generic retry message rather than leaking the raw RPC/Postgres text (CLAUDE.md §8).
 */
export function describeSaveError(message: string): string {
  if (message.includes("Already exists") || /duplicate key|unique constraint/i.test(message)) {
    return "บันทึกไม่ได้ — มี Composition ชื่อนี้อยู่แล้ว";
  }
  if (message.includes("Already modified")) {
    return "Composition นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง";
  }
  if (message.includes("cannot change the layout of an active composition")) {
    return "เปลี่ยน Layout ไม่ได้ขณะ Composition กำลัง Active";
  }
  return "บันทึก Composition ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

/** `media_composition_set_zones` / `media_composition_set_status` name the unbound Zones in
 *  the raised message, e.g. "zone(s) Ticker, Main are unbound" — shown as-is (already Thai-safe
 *  Zone names), just stripped of the RPC's own English scaffolding. */
export function describeActivateError(message: string): string {
  const match = /zone\(s\) (.+) are unbound/.exec(message);
  if (match) return `เปิดใช้งานไม่ได้ — ยังไม่ได้ผูก Content ให้ Zone: ${match[1]}`;
  if (message.includes("cannot move a composition back to draft")) {
    return "ย้าย Composition กลับไป Draft ไม่ได้";
  }
  return describeSaveError(message);
}
