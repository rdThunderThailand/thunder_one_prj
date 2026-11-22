import type { ChannelDeleteMode, ChannelDetail } from "./types/index.ts";

/**
 * The delete dialog's advisory lines before "This can't be undone." (ADR 0122 rule 20). Core decides
 * the mode when Delete is confirmed, so this only says what is likely. `null` detail (still loading,
 * or the read failed) gets the no-history text.
 */
export function deleteDialogLines(
  detail: Pick<ChannelDetail, "draft_programs" | "has_history"> | null,
  playerName: string | null,
): string[] {
  const lines = playerName ? [`${playerName} becomes available for another Channel.`] : [];
  if (!detail?.has_history) return lines;
  if (detail.draft_programs.length > 0) {
    lines.push(`These Draft Programs lose this Channel: ${detail.draft_programs.map((program) => program.name).join(", ")}.`);
  }
  lines.push("Past Programs and Playback Proof keep its name, marked deleted.");
  return lines;
}

/** The success toast follows the mode Core returned; a Core that sends none gets the phase-1 text. */
export function deleteSuccessMessage(mode: ChannelDeleteMode | undefined, playerName: string | null): string {
  const base = playerName ? `Channel deleted — ${playerName} is free` : "Channel deleted";
  return mode === "tombstoned" ? `${base}. Its history is kept.` : base;
}
