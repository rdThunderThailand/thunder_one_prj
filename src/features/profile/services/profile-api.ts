// Real Thunder_Core integration for the Profile page (/profile) and Account
// & Security page (/account-security), both of which show the same "me"
// data. Two access patterns, same split every other people/* service uses:
// getMyProfile is server-only (coreGet, token passed in explicitly);
// updateUserProfile is client-safe (goes through /api/proxy) since it's
// called from "use client" edit forms.
//
// `GET /api/core/v1/me` returns everything below — confirmed real by reading
// thunder_core_API directly (2026-09-16). Writing is far narrower:
// `PATCH /api/core/v1/users/{id}` (`updateProfileSchema` in Core's
// src/lib/core/member-view.ts) only accepts the fields in UpdateProfileInput
// below — `display_name`/`avatar_url`/`preferred_language`/`timezone` are
// real to *read* but have no PATCH write path — don't send them in a PATCH
// body (the schema is `.strict()`, unknown keys → 400). `avatar_url` has its
// own dedicated upload route instead: `uploadMyAvatar`/`removeMyAvatar` below.
//
// `first_name_th`/`last_name_th` real since 2026-09-16 (commit `f15d612`) —
// both read and write; see `people/personnel`'s `CoreMemberRow.user` comment
// for the full history (write-only for ~10 minutes after `489c3b1` before
// the read-back fix landed).
//
// `title_prefix`/`first_name_en`/`last_name_en`/`gender`/`date_of_birth`/
// `phone`/`address`/`nationality`/`ethnicity` real since 2026-09-16 (commit
// `d33d21a`) — same write-then-read-back-gap-then-fixed story: accepted by
// `updateProfileSchema` for a while before `GET /me`'s select (and the
// PATCH response's own select) caught up. Confirmed end-to-end (write, then
// read back a fresh value) directly against Core before trusting it here.
import { coreGet } from "@/lib/core/core-get";
import { ApiError } from "@/lib/api/api-error";
import { requestApi } from "@/lib/api/media-api";
import { getMembers, type CoreMemberRow } from "@/features/people/personnel/services/members-api";

export interface CoreMe {
  id: string;
  global_user_code: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  title_prefix: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  nationality: string | null;
  ethnicity: string | null;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  timezone: string | null;
  default_tenant_id: string | null;
  role: string | null;
}

export async function getMyProfile(token: string): Promise<CoreMe | null> {
  return coreGet<CoreMe>("/me", token);
}

export interface UpdateProfileInput {
  first_name?: string | null;
  last_name?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
}

/**
 * `PATCH /users/:id` — despite the name, `userId` isn't locked to "the
 * caller's own id": Core's `updateProfileSchema` route also permits a
 * `company_admin` editing another user sharing an administered tenant (or
 * `super_admin`, any user). `people/personnel`'s `EditPersonnelModal` reuses
 * this directly for that HR-editing-someone-else's-record case, rather than
 * duplicating a thin wrapper — same "share the real service" reasoning as
 * `people/personnel`'s own barrel exports.
 */
export async function updateUserProfile(userId: string, input: UpdateProfileInput): Promise<CoreMe> {
  return requestApi<CoreMe>("PATCH", `/users/${userId}`, input);
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

/**
 * `PATCH /api/core/v1/me/password` — real since 2026-09-16 (Core commit
 * `d33d21a`). Verifies `current_password` server-side via
 * `signInWithPassword` before applying the change through
 * `adminClient.auth.admin.updateUserById` — there is no way to bypass the
 * current-password check. A wrong current password comes back as a 401
 * ("current password is incorrect"), surfaced as an `ApiError` the same way
 * every other Core 4xx is in this app. Confirmed directly against Core
 * (a deliberately-wrong password correctly 401s, no mutation) before
 * wiring this in.
 */
export async function changePassword(input: ChangePasswordInput): Promise<{ updated: boolean }> {
  return requestApi<{ updated: boolean }>("PATCH", "/me/password", input);
}

/**
 * The caller's own membership row on their current tenant — status,
 * member_type, job_type, start_date, default_department_id, none of which
 * `GET /me` (above) returns. There's no self-service "my membership" route,
 * so this reuses `GET /tenants/:id/members?search=<email>` (the same
 * admin-facing Personnel roster endpoint, but real-open to any active
 * member — confirmed by reading its route handler directly 2026-09-22) and
 * picks out the row matching `userId`, exactly like `get-session.ts`'s own
 * `resolveMembershipExtras` already does for `jobTitle`. `null` on any
 * failure or no match — a display nicety, not worth failing the page over.
 */
export async function getMyMembership(token: string, tenantId: string, userId: string, email: string): Promise<CoreMemberRow | null> {
  const page = await getMembers(token, tenantId, { search: email, limit: 5 });
  return page?.rows.find((row) => row.user_id === userId) ?? null;
}

/** Accepted by Core's avatars bucket — checked client-side first so a wrong
 *  file fails instantly instead of after an upload round-trip. */
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/**
 * `POST /me/avatar` (multipart, field `file`) — uploads the caller's own
 * profile picture and sets `users.avatar_url`; returns the new URL. Agreed
 * with the thunder_core_API session 2026-09-25. Native `fetch`, not
 * `requestApi`: the shared axios instance forces `Content-Type:
 * application/json`, which a FormData body can't override (same reason as
 * asset-intelligence's `uploadAssetAttachment`).
 */
export async function uploadMyAvatar(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/proxy/me/avatar", { method: "POST", body: formData });
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && typeof body === "object" && "error" in body)) {
    throw new ApiError((body as { error?: string } | null)?.error ?? `HTTP Error ${res.status}`, res.status);
  }
  return (body as { data?: { avatar_url?: string | null } } | null)?.data?.avatar_url ?? null;
}

/** `DELETE /me/avatar` — removes the picture; initials show again. */
export async function removeMyAvatar(): Promise<void> {
  await requestApi<{ avatar_url: null }>("DELETE", "/me/avatar");
}
