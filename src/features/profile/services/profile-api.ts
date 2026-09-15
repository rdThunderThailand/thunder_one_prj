// Real Thunder_Core integration for the Profile page (/profile) and Account
// & Security page (/account-security), both of which show the same "me"
// data. Two access patterns, same split every other people/* service uses:
// getMyProfile is server-only (coreGet, token passed in explicitly);
// updateMyProfile is client-safe (goes through /api/proxy) since it's called
// from the edit-profile modal's "use client" form.
//
// `GET /api/core/v1/me` returns everything below — confirmed real by reading
// thunder_core_API directly (2026-09-16). Writing is far narrower:
// `PATCH /api/core/v1/users/{id}` (`updateProfileSchema` in Core's
// src/lib/core/member-view.ts) only accepts the fields in UpdateProfileInput
// below — `display_name`/`avatar_url`/`preferred_language`/`timezone` are
// real to *read* but have NO write path anywhere in Core today. Don't send
// them in a PATCH body — the schema is `.strict()` and rejects unknown keys
// with a 400.
import { coreGet } from "@/lib/core/core-get";
import { requestApi } from "@/lib/api/media-api";

export interface CoreMe {
  id: string;
  global_user_code: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
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
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput): Promise<CoreMe> {
  return requestApi<CoreMe>("PATCH", `/users/${userId}`, input);
}
