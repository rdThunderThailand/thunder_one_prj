// Real Thunder_Core integration for NewHiresPage's Kanban roster — server-
// only, same "coreGet, fails open to null" shape as org-structure/personnel.
//
// Proposed 2026-09-15 (docs/people/new-hires-onboarding-roster-field-
// requirements.md): extends the existing GET /tenants/:id/members with
// ?include=onboarding rather than a new resource. Not yet confirmed live on
// Core's side — a 404/shape-mismatch here just means `coreGet` returns
// `null` like any other unreachable Core route, and the page renders the
// same "ไม่สามารถโหลดข้อมูลได้" state every other real-data page here already
// uses on a Core fetch failure. Nothing special to handle once Core ships
// it — this file already expects the final shape.
import { coreGet } from "@/lib/core/core-get";
import { requestApi } from "@/lib/api/media-api";
import type { CoreMemberRow } from "@/features/people/personnel";

export interface CoreOnboardingRow extends CoreMemberRow {
  onboarding: { done: number; total: number };
}

export async function getOnboardingRoster(token: string, tenantId: string): Promise<CoreOnboardingRow[] | null> {
  const data = await coreGet<{ data: CoreOnboardingRow[] }>(
    `/tenants/${tenantId}/members?include=onboarding&limit=100`,
    token
  );
  return data ? data.data : null;
}

interface OnboardingStepResult {
  step_index: number;
  done: boolean;
  pending_label: string | null;
  completed_at: string | null;
}

/** `PATCH /tenants/:id/members/:memberId/onboarding` — real, confirmed by
 *  reading `thunder_core_API`'s route directly (not proposed — this one
 *  already existed before today). Client-safe (`requestApi`, via
 *  `/api/proxy`), for the Kanban's drag-and-drop: moving a card to a new
 *  column fires one call per step index that needs to flip — see
 *  `NewHiresPage.tsx`'s `handleMoveStage` for exactly which indices. */
export async function updateOnboardingStep(
  tenantId: string,
  memberId: string,
  stepIndex: number,
  done: boolean
): Promise<OnboardingStepResult> {
  return requestApi<OnboardingStepResult>("PATCH", `/tenants/${tenantId}/members/${memberId}/onboarding`, {
    step_index: stepIndex,
    done,
  });
}
