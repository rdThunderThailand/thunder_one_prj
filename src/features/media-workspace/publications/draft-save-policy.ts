import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import { isDraftValid } from "./schedule-preset.ts";

export type DraftPersistResult =
  | { kind: "skipped" }
  | { kind: "saved"; publicationId: string; draft: DraftFields; isComplete: boolean };

export class DraftSaveError extends Error {}

// ADR 0086 §2: Back must not hide fields already edited on Program.
export function draftSavePolicy(
  state: Pick<DraftFields, "basicInfo" | "step" | "furthestStep" | "schedule">,
  forPublish: boolean,
) {
  const shouldPersist = forPublish || Boolean(state.basicInfo.name.trim());
  const reachedProgram = Math.max(state.step, state.furthestStep) >= 3;
  const sendTargets = forPublish || reachedProgram;
  const sendSchedule = forPublish || (reachedProgram && isDraftValid(state.schedule));
  return { shouldPersist, sendTargets, sendSchedule, isComplete: shouldPersist && (!reachedProgram || sendSchedule) };
}

export function requireCompleteDraftSave(result: DraftPersistResult) {
  if (result.kind === "skipped") throw new DraftSaveError("กรุณากรอกชื่อ Program ก่อนบันทึกร่าง");
  if (!result.isComplete) throw new DraftSaveError("บันทึกข้อมูลส่วนอื่นแล้ว แต่ schedule ยังไม่ถูกต้อง กรุณาทำต่อจาก draft เดิมเพื่อแก้ไข");
  return result;
}
