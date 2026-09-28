// Real Thunder_Core integration for Lead Approval's Aurora migration requests.
// Routes live on prod since Core v0.2.1 — src/app/api/core/v1/aurora-
// migration-requests/ in thunder_core_API, wrapping thunder_crm_lineoa's
// aurora_migration_requests (requests sent from the LINE OA LIFF form). Same
// TEMPORARY Ops surface as partner-applications-api.ts — keep it lightweight.
// Read-only for now: the approve route (POST /:id/approve) isn't wired yet.
import { coreGet } from "@/lib/core/core-get";

export type AuroraMigrationStatus = "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED";
export type AuroraRole = "COORDINATOR" | "USER" | "INSPECTOR";
export type AuroraModule = "CONTENT" | "PLAYLIST" | "SCHEDULE" | "PUBLISH" | "SCREENS" | "ADMIN";
export type AuroraApprovalRole = "MEDIA_USER" | "ON_SITE_USER";

export interface CoreAuroraMigrationRequest {
  id: string;
  /** e.g. "MIG-2026-00001" — the number the requester sees in LINE. */
  reference_no: string;
  status: AuroraMigrationStatus;
  first_name: string;
  last_name: string;
  company_name: string;
  position: string | null;
  email: string;
  phone: string;
  /** What the requester asked for — context for the reviewer only, not
   *  mapped to `approved_role` automatically. */
  aurora_roles: AuroraRole[];
  aurora_modules: AuroraModule[];
  /** Free-text site names typed by the requester. */
  sites: string[];
  /** Set only when `status === "APPROVED"`. */
  approved_role: AuroraApprovalRole | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  line_profile: { display_name: string | null; picture_url: string | null } | null;
  reviewer: { id: string; name: string | null; email: string | null } | null;
}

/**
 * GET /aurora-migration-requests — newest 100, no filter/paging (filter
 * client-side, same as partner applications). Reviewer-only (super_admin, or
 * company_admin of THUNDER_001); `null` on any failure including that 403 —
 * coreGet's fail-open contract, so the caller can't tell "not a reviewer"
 * from "Core is down" through this function alone.
 */
export async function getAuroraMigrationRequests(token: string): Promise<CoreAuroraMigrationRequest[] | null> {
  return coreGet<CoreAuroraMigrationRequest[]>("/aurora-migration-requests", token);
}
