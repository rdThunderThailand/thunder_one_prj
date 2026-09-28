// Real Thunder_Core sources for My Work — server-only, token passed in
// explicitly, every fetcher fails open to `null` (coreGet's contract).
//
// Core has no task/assignment system, so "my work" is assembled from the
// Core records that actually ask something of the signed-in user:
// - Partner applications awaiting review (reviewers only — anyone else gets
//   a 403, which reads as `null` here, same as a failure).
// - From one member-roster read (`?include=onboarding`): members still in
//   `invited` status (invite not accepted yet) and members whose onboarding
//   checklist isn't finished (progress counts only — Core's step labels are
//   still placeholders).
// - Media publication drafts this user created (`created_by`).
// Minimal local types rather than importing other features' internal
// service files — same "each feature owns its own services/*-api.ts"
// convention the rest of the app follows.
import { coreGet } from "@/lib/core/core-get";

export interface PartnerApplicationRow {
  id: string;
  status: "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED";
  actor_id: string;
  external_application_id: string;
  submitted_at: string;
  reviewed_at: string | null;
  tenant: { id: string; name: string | null } | null;
  applicant: { id: string; name: string | null; email: string | null } | null;
}

export interface RosterMemberRow {
  id: string;
  status: "invited" | "active" | "suspended" | "removed" | "archived";
  joined_at: string;
  start_date: string | null;
  user: { full_name: string } | null;
  onboarding: { done: number; total: number } | null;
}

export interface DraftPublicationRow {
  id: string;
  name: string;
  starts_at?: string | null;
  updated_at?: string;
  created_by?: { id: string; display_name: string } | null;
}

export async function getPartnerApplications(token: string): Promise<PartnerApplicationRow[] | null> {
  return coreGet<PartnerApplicationRow[]>("/partner-applications", token);
}

export async function getRoster(token: string, tenantId: string): Promise<RosterMemberRow[] | null> {
  const data = await coreGet<{ data: RosterMemberRow[] }>(
    `/tenants/${tenantId}/members?include=onboarding&limit=100`,
    token
  );
  return data ? data.data : null;
}

export async function getDraftPublications(token: string): Promise<DraftPublicationRow[] | null> {
  const data = await coreGet<{ publications?: DraftPublicationRow[] } | DraftPublicationRow[]>(
    "/media/publications?status=draft",
    token
  );
  if (data === null) return null;
  return Array.isArray(data) ? data : (data.publications ?? null);
}
