// Per-step gate for the Create Playlist wizard, same shape as the publications one
// (docs/adr/0001-wizard-step-contract.md) minus the persistence half — Next still just
// validates then calls setStep; the actual draft-row save now happens in
// CreatePlaylistPage's goNext handler (docs/adr/0012-playlist-draft-save.md).

import type { DraftItem, PlaylistPlayback } from "./types";
import { PLAY_MODES, REPEAT_MODES, START_FROMS } from "./types";

export const PLAYLIST_LIMITS = {
  nameMax: 100,
  descriptionMax: 300,
} as const;

export type WizardStepId = 1 | 2 | 3;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidatableDraft {
  name: string;
  description?: string;
  items: DraftItem[];
  playback: Pick<PlaylistPlayback, "playMode" | "repeat" | "startFrom">;
}

export type BasicInfoFieldId = "name" | "description";
export type BasicInfoErrors = Partial<Record<BasicInfoFieldId, string>>;

export function validateBasicInfo(
  draft: Pick<ValidatableDraft, "name" | "description">
): BasicInfoErrors {
  const errors: BasicInfoErrors = {};
  const trimmed = draft.name.trim();
  if (trimmed.length === 0) {
    errors.name = "ตั้งชื่อ playlist ก่อน";
  } else if (trimmed.length > PLAYLIST_LIMITS.nameMax) {
    errors.name = `ชื่อยาวเกิน ${PLAYLIST_LIMITS.nameMax} ตัวอักษร`;
  }
  if ((draft.description?.length ?? 0) > PLAYLIST_LIMITS.descriptionMax) {
    errors.description = `คำอธิบายยาวเกิน ${PLAYLIST_LIMITS.descriptionMax} ตัวอักษร`;
  }
  return errors;
}

export function validateStep(
  step: WizardStepId,
  draft: ValidatableDraft
): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    errors.push(...Object.values(validateBasicInfo(draft)));
  }

  if (step === 2 && draft.items.length === 0) {
    errors.push("เลือก media อย่างน้อย 1 ชิ้น");
  }

  if (step === 3) {
    // ponytail: no real engine-capability registry yet (see .docs/player_codec_capability_request.md,
    // still pending firmware team answer) — this only checks against the frontend's own known value
    // sets; the authoritative reject happens server-side in media_playlist_upsert.
    if (draft.playback.playMode !== undefined && !(PLAY_MODES as readonly string[]).includes(draft.playback.playMode)) {
      errors.push("Play Mode ที่เลือกไม่รองรับ");
    }
    if (draft.playback.repeat !== undefined && !(REPEAT_MODES as readonly string[]).includes(draft.playback.repeat)) {
      errors.push("Repeat ที่เลือกไม่รองรับ");
    }
    if (draft.playback.startFrom !== undefined && !(START_FROMS as readonly string[]).includes(draft.playback.startFrom)) {
      errors.push("Start Playback From ที่เลือกไม่รองรับ");
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Whether the wizard can be submitted at all — every step's rules at once. */
export function canSubmit(draft: ValidatableDraft): boolean {
  return ([1, 2, 3] as WizardStepId[]).every((step) => validateStep(step, draft).valid);
}
