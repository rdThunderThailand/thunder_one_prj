// The blocker links an in-use refusal shows (ADR 0130). No React and no runtime imports, so
// `in-use-links.check.mts` runs under plain `node`.

export type InUseLink = { href: string; label: string };

/** Each screen's own short line, shown above the links in place of Core's names (ADR 0130 §3). */
export const IN_USE_LEAD: Record<"playlistTrash" | "groupDelete" | "channel" | "templateZone", string> = {
  playlistTrash: "ย้ายลงถังไม่ได้ — Playlist นี้ถูกใช้อยู่ใน Program ด้านล่าง กรุณา End Program ที่ Active และลบ Program ที่เป็น Draft ก่อน",
  groupDelete: "ลบ Group นี้ไม่ได้ เพราะยังถูกใช้ใน Program ด้านล่าง (Program ที่ Ended แล้วจะยังนับอยู่)",
  channel: "ยังมี Program ด้านล่างใช้ Channel นี้อยู่ กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อน",
  templateZone: "ลบ Zone ไม่ได้ — Template นี้ยังถูกใช้ใน Layout ด้านล่าง กรุณาเอา Zone นี้ออกจาก Layout เหล่านั้นก่อน",
};

/** Every status goes to the detail page, Draft included: the wizard cannot delete a Draft. */
export function programLinks(rows: { id: string; name: string }[]): InUseLink[] {
  return rows.map((row) => ({ href: `/media-workspace/program/${row.id}`, label: row.name }));
}

/** Core counts Programs that are over as Group blockers, so their link says so. */
export function groupDeleteLinks(
  rows: { id: string; name: string; status: string; effective_status?: string }[],
): InUseLink[] {
  return programLinks(
    rows.map((row) => {
      if (row.status === "cancelled") return { id: row.id, name: `${row.name} (Cancelled)` };
      if (row.effective_status === "ended") return { id: row.id, name: `${row.name} (Ended)` };
      return row;
    }),
  );
}

/** Core's Trash refusal counts the stored `status`, not the clock-aware one. */
export function playlistTrashLinks(programs: { id: string; name: string; status: string }[]): InUseLink[] {
  return programLinks(programs.filter((program) => program.status === "draft" || program.status === "active"));
}

/** `undefined` = a Core that does not return the Template's Layouts yet, so there is nothing to link. */
export function templateZoneLinks(
  compositions: { id: string; name: string; zone_ids: string[]; in_trash: boolean }[] | undefined,
  removedZoneIds: string[],
): InUseLink[] {
  return (compositions ?? [])
    .filter((composition) => composition.zone_ids.some((id) => removedZoneIds.includes(id)))
    .map((composition) => ({
      href: `/media-workspace/layouts/${composition.id}`,
      label: composition.in_trash ? `${composition.name} (ในถังขยะ)` : composition.name,
    }));
}

/** The loaded Zone ids that no current Zone carries; a Zone without an id is new. */
export function removedZoneIds(loaded: string[], current: { id?: string }[]): string[] {
  const kept = new Set(current.map((zone) => zone.id));
  return loaded.filter((id) => !kept.has(id));
}
