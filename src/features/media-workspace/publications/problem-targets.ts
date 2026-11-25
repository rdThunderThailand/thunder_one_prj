import type { PublicationTarget } from "./types";
import type { ChannelListItem } from "../channels/types";
import { canBeProgramTarget } from "../channels/lifecycle-actions.ts";

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

/**
 * ADR 0122 rule 17 (2026-11-24): the selected Channels the wizard's picker cannot show. Saved problem
 * targets keep their saved name; a pick in the list but not Active gets the not-Active line under its
 * listed name; a pick missing from the list is unlisted. `channels` is null until the list has loaded
 * without error, so nothing is judged against an empty or partial read.
 */
export function selectedProblemTargets(
  channelIds: readonly string[],
  loaded: readonly ProblemTarget[],
  channels: readonly Pick<ChannelListItem, "id" | "name" | "lifecycle">[] | null,
): { targets: ProblemTarget[]; unlistedIds: string[] } {
  const targets = loaded.filter((target) => channelIds.includes(target.id));
  const unlistedIds: string[] = [];
  if (!channels) return { targets, unlistedIds };
  for (const id of channelIds) {
    if (targets.some((target) => target.id === id)) continue;
    const channel = channels.find((item) => item.id === id);
    if (!channel) unlistedIds.push(id);
    else if (!canBeProgramTarget(channel)) targets.push({ id, name: channel.name, deleted: false });
  }
  return { targets, unlistedIds };
}

/** The one line for every unlisted pick: the draft keeps no Channel names to show. */
export function unlistedPicksText(count: number): string {
  return `ช่องทางที่เลือกไว้ ${count} รายการไม่มีในระบบแล้ว — นำออกก่อนบันทึกหรือเผยแพร่`;
}

/** The notice's one line for a problem target, in the Thai of the other publish notices. */
export function problemTargetText(target: ProblemTarget): string {
  return target.deleted
    ? `ช่องทาง ${target.name} ถูกลบแล้ว — นำออกก่อนเผยแพร่`
    : `ช่องทาง ${target.name} ยังไม่เปิดใช้งาน — เลือกช่องทางอื่นก่อนเผยแพร่`;
}
