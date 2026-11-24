// Real Thunder_Core integration for Lead Approval. Routes live on prod
// (thundercore.vercel.app) since 2026-09-25 — thunder_core_API PRs #92/#93,
// src/app/api/core/v1/partner-applications/. Wraps thunder_crm_lineoa's
// partner_applications/partner_relationships. The whole surface is a
// TEMPORARY Ops tool slated to be wiped later — keep it lightweight.
//
// Same server-only vs. client-safe split as profile/services/profile-api.ts:
// the list GET is server-only (coreGet, token passed in explicitly); the
// review PATCH is client-safe (goes through /api/proxy) since it's called
// from LeadApprovalPage's "use client" approve/reject buttons.
import { coreGet } from "@/lib/core/core-get";
import { requestApi } from "@/lib/api/media-api";

export type PartnerApplicationStatus = "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED";

export interface CorePartnerApplication {
  id: string;
  tenant_id: string;
  applicant_user_id: string;
  external_application_id: string;
  status: PartnerApplicationStatus;
  version: number;
  actor_id: string;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  /** `null` when the tenant lookup failed — Core enriches this, the raw
   *  Supabase row has no display fields at all (schema doc: "สถานะย่อ"
   *  only, the full application lives in a separate system). */
  tenant: { id: string; name: string | null } | null;
  applicant: { id: string; name: string | null; email: string | null } | null;
}

/**
 * GET /partner-applications — wraps thunder_crm_lineoa's
 * list_partner_applications_for_review(user.id), which itself enforces the
 * caller is a super_admin (`is_partner_reviewer`) and hard-caps at 100 rows
 * ordered by created_at desc, no filter/paging. `null` on any failure,
 * including a real 403 (not a reviewer) — same fail-open-to-null contract
 * coreGet always has; the caller can't yet distinguish "not a reviewer"
 * from "Core is down" through this function alone.
 */
export async function getPartnerApplications(token: string): Promise<CorePartnerApplication[] | null> {
  return coreGet<CorePartnerApplication[]>("/partner-applications", token);
}

export interface ReviewPartnerApplicationInput {
  status: Extract<PartnerApplicationStatus, "APPROVED" | "REJECTED" | "NEEDS_INFO">;
  /** The `version` this client last saw — optimistic concurrency. A stale
   *  value comes back as a 409 (STALE_VERSION/VERSION_CONFLICT), not a
   *  silent overwrite of a decision someone else already made. */
  version: number;
}

/**
 * PATCH /partner-applications/:id/review — only valid from PENDING (→
 * NEEDS_INFO/APPROVED/REJECTED). NEEDS_INFO/APPROVED/REJECTED are dead ends
 * for a reviewer: NEEDS_INFO → PENDING only happens applicant-side, and
 * APPROVED/REJECTED are terminal. LeadApprovalPage must only show these 3
 * actions when `status === "PENDING"`.
 */
export async function reviewPartnerApplication(
  id: string,
  input: ReviewPartnerApplicationInput
): Promise<CorePartnerApplication> {
  return requestApi<CorePartnerApplication>("PATCH", `/partner-applications/${id}/review`, input);
}
