/** อดีต: จบตามเวลาแล้ว หรือถูกยกเลิก (ADR 0015). */
export function isPastPublication(item: { status: string; effective_status?: string }): boolean {
  return item.effective_status === "ended" || item.status === "cancelled";
}
