import type { PublicationTarget } from "./types";

export type ProblemTarget = { id: string; name: string; deleted: boolean };

/**
 * ADR 0122 rule 17: the Channel targets Publish would refuse — deleted, or not Active — under their
 * saved name. A Core that predates `status` / `deleted` reports neither, so nothing is flagged.
 */
export function problemTargets(targets: readonly PublicationTarget[]): ProblemTarget[] {
  return targets.flatMap((target) => {
    if (target.target_type !== "channel" || !target.channel_id) return [];
    const deleted = target.deleted === true;
    const inactive = typeof target.status === "string" && target.status !== "active";
    if (!deleted && !inactive) return [];
    return [{ id: target.channel_id, name: target.name || "(ไม่ทราบชื่อ)", deleted }];
  });
}

/** The notice's one line for a problem target, in the Thai of the other publish notices. */
export function problemTargetText(target: ProblemTarget): string {
  return target.deleted
    ? `ช่องทาง ${target.name} ถูกลบแล้ว — นำออกก่อนเผยแพร่`
    : `ช่องทาง ${target.name} ยังไม่เปิดใช้งาน — เลือกช่องทางอื่นก่อนเผยแพร่`;
}
