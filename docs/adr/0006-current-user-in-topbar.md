# 0006 — Current user in the Topbar: name only, resolved server-side from Core `/me`

## Context

ADR 0005 put the app behind a login and made publish attribution real. It left the Topbar showing a
hardcoded identity: `src/components/layout/Topbar.tsx` defaults to `userName = "Kanittha W."` and
`userRole = "Media Manager"`, and `(dashboard)/layout.tsx` renders `<Topbar />` with no props, so
those defaults are what every operator sees. There is now a working **Log out** button sitting
underneath a fabricated name, which is worse than the state before login existed — the fake identity
now looks authoritative.

Four facts, all verified against the running system rather than inferred:

- **Core already has a current-user endpoint.** `GET /api/core/v1/me` requires `x-api-key` *and* a
  Bearer token, and returns `id, global_user_code, email, first_name, last_name, display_name,
  avatar_url, preferred_language, timezone, default_tenant_id` plus a resolved `role`. Its last
  commit (`bfcc799`, 2026-07-23) is contained in `origin/develop`, so it is live on
  `thundercore.vercel.app` today. No backend change and no merge is required for this ADR.
- **Thunder One already holds everything the call needs.** `src/app/api/auth/login/route.ts` stores
  the Core access token in the `to_at` httpOnly cookie, and `src/app/api/proxy/[...path]/route.ts`
  already pairs `x-api-key` with `Authorization: Bearer <to_at>` for Core calls.
- **`display_name` is not a single column.** Migration `074_publication_get_published_by.sql`
  established the canonical fallback for rendering a person:
  `COALESCE(NULLIF(BTRIM(display_name),''), NULLIF(BTRIM(first_name || ' ' || last_name),''), email)`.
  `/me` returns the raw columns, not the resolved string, so any caller must apply the same chain.
- **Role vocabulary is fiction in three different ways at once.** Thunder One's
  `src/features/auth/types/auth.types.ts` declares
  `UserRole = "administrator" | "media_operator" | "viewer"` with a comment claiming it mirrors
  `CONTEXT.md`. Thunder_Core's `src/types/auth.ts` declares
  `'super_admin' | 'company_admin' | 'executive_viewer' | 'operator' | 'viewer_auditor'`. The
  `public.roles` table on prod holds `role_type` values `super_admin`, `company_admin`,
  `department_admin`, `executive_viewer`, `operator`, `tenant`. No two of those three agree:
  `department_admin` and `tenant` exist in the data but in neither union, `viewer_auditor` exists in
  Core's union but has no row in the table, and *"Media Manager"* — the string on screen today —
  appears in none of them. Every persona in `roles.code` is facilities-flavoured
  (`operator_technician` "ช่างเทคนิค", `operator_procurement` "งานจัดซื้อ", `main_staff` "หัวหน้าช่าง");
  there is no media persona in the system at all.

## Decision

**The Topbar shows the logged-in user's name and nothing else. The name is resolved server-side in
the dashboard layout from Core `GET /api/core/v1/me`.**

Concretely:

1. A server-side helper reads the `to_at` cookie, calls Core `/me` with `x-api-key` + Bearer, and
   applies the migration-074 fallback chain to produce one display string. It calls Core directly
   rather than going through `/api/proxy/*`, matching what `src/app/api/auth/login/route.ts`
   already does — a Server Component has no origin-relative URL to call its own route handler with.
2. `(dashboard)/layout.tsx` awaits that helper and passes the name into `<Topbar />`. The layout is
   already a Server Component, so there is no `'use client'`, no fetch-on-mount, and no interval
   during which a wrong name is on screen.
3. **`401` redirects to `/login`.** A dead token with a live cookie is precisely the state ADR 0005
   exists to prevent: the operator appears logged in, but every publish records
   `published_by = null`. Failing loudly at the layout is the only place that state is observable.
4. **Any other failure (network, 5xx) renders the placeholder `"Account"` and lets the dashboard
   load.** Core being down is not an authentication problem, and bouncing to `/login` would strand
   the user on a page whose login call is equally down.
5. **`UserRole` and `AuthUser` are deleted** from `src/features/auth/types/auth.types.ts` and the
   feature's public API. `AuthUser` was referenced only by the non-functional `register()` stub,
   whose return value `RegisterForm` discards.

### Why no role

Showing a role requires choosing which of the three disagreeing vocabularies is true, and none of
them is: the frontend union is invented, Core's union contradicts its own table, and the table
contains no media personas. A role label on screen is also a claim the UI cannot currently honour —
Thunder One has no permission gates, so every operator sees every action regardless. Rendering an
unbacked label next to a real logout button repeats the exact mistake this ADR is correcting.

Role becomes a real decision when permission gates arrive. At that point the vocabulary has to be
reconciled deliberately, and `roles.code` (persona) versus `roles.role_type` (tier) is the
distinction to start from — Core's own `getUserRole` comment already draws it.

## Options rejected

**Fetch `/me` from the client through `/api/proxy/me`.** Reuses the proxy with no new helper, but
the Topbar renders in the dashboard layout on every page — the user would watch an empty or
placeholder name resolve on each load, and every navigation pays a client round-trip. The data is
available server-side before first paint; spending a flash of wrong UI to avoid ten lines is a bad
trade.

**Cache the name in a cookie at login.** Removes the per-load call, but introduces state that must be
invalidated when a user renames themselves, and gives a second source of truth for something the
server can answer for free. Rejected as premature.

**Mirror Core's `UserRole` union into the frontend.** Was the initial plan; abandoned once the
`public.roles` table was queried. It would have imported a vocabulary that disagrees with the data
it claims to describe, which is the same failure as the current fiction with a longer paper trail.

**Add `/auth/me` to Thunder_Core.** What the previous session's handoff assumed was necessary. It
is not — `/api/core/v1/me` already exists and is deployed. Recorded here because the assumption
survived a full session unchallenged.

## Findings deliberately not acted on

Out of scope for this change, but confirmed on prod and worth fixing separately:

- **`getUserRole` silently mis-resolves two role types.** `ROLE_PRIORITY` in
  `Thunder_Core/src/utils/supabase/rbac.ts` has no entry for `department_admin` or `tenant`, so
  `ROLE_PRIORITY[roleType] || 0` yields `0`, which can never exceed the initial `highestPriority`
  of `0`. Every user whose highest membership is one of those two resolves to `'operator'`. The
  function's return type also asserts `UserRole` over a value cast from an unvalidated string.
- **`Topbar`'s `notificationCount` defaults to `13`** with no data behind it — the same class of
  fabricated UI as the hardcoded name, left for whenever notifications become real.

## Verification required before this is called done

Per the project standard, `tsc` and `lint` passing is not verification. Log in as a real user in a
browser and confirm the Topbar shows that user's name (not "Kanittha W."), that the name matches
what the publication detail page renders in `published_by` for a publication that user published,
and that logging out and back in as a different user changes it.
