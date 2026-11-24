import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import { isDraftValid } from "./schedule-preset.ts";

export type DraftPersistResult =
  | { kind: "skipped"; reason: "name" | "content" }
  | { kind: "saved"; publicationId: string; draft: DraftFields; isComplete: boolean };

export class DraftSaveError extends Error {}

export function draftHasContent(state: Pick<DraftFields, "assetItems" | "playlistId" | "compositionId">) {
  return state.assetItems.length > 0 || Boolean(state.playlistId) || Boolean(state.compositionId);
}

// ADR 0086 §2: Back must not hide fields already edited on Program.
// #331: nothing is saved until a content choice exists, new Draft or saved one alike, so a Draft
// can never be written without its Playlist, Layout or files.
export function draftSavePolicy(
  state: Pick<DraftFields, "basicInfo" | "assetItems" | "playlistId" | "compositionId" | "step" | "furthestStep" | "schedule">,
  forPublish: boolean,
) {
  const shouldPersist = forPublish || (Boolean(state.basicInfo.name.trim()) && draftHasContent(state));
  const reachedProgram = Math.max(state.step, state.furthestStep) >= 3;
  const sendTargets = forPublish || reachedProgram;
  const sendSchedule = forPublish || (reachedProgram && isDraftValid(state.schedule));
  return { shouldPersist, sendTargets, sendSchedule, isComplete: shouldPersist && (!reachedProgram || sendSchedule) };
}

export function requireCompleteDraftSave(result: DraftPersistResult) {
  if (result.kind === "skipped") {
    throw new DraftSaveError(result.reason === "content" ? "กรุณาเลือก Content ก่อนบันทึกร่าง" : "กรุณากรอกชื่อ Program ก่อนบันทึกร่าง");
  }
  if (!result.isComplete) throw new DraftSaveError("บันทึกข้อมูลส่วนอื่นแล้ว แต่ schedule ยังไม่ถูกต้อง กรุณาทำต่อจาก draft เดิมเพื่อแก้ไข");
  return result;
}
