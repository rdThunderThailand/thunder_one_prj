# 0005 — Publisher attribution via Thunder gateway login and optional JWT verification

## Context

Operators need to answer "who published this?". Today nobody can: verified on prod 2026-08-05,
`media_core.publications` holds 28 rows and **`published_by` is NULL on all 28**.

The reason is not a missing schema. Almost the entire path already exists:

- `media_core.publications.published_by uuid` exists, with
  `publications_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE SET NULL`.
- `media_publication_activate(p_tenant_id uuid, p_publication_id uuid, p_actor_id uuid DEFAULT NULL)`
  **already writes `published_by = p_actor_id`** (confirmed by dumping `pg_proc.prosrc`).
- `public.users` mirrors `auth.users` one-to-one — 43 rows each, all 43 ids matching — so a
  Supabase Auth user id is directly usable as `published_by` with no mapping table.
- Thunder_Core already exposes `POST /api/core/v1/auth/login`
  (`src/app/api/core/v1/auth/login/route.ts`), gated by `x-api-key`, returning
  `{ access_token, refresh_token, expires_at, user_id }`. Its own comment states the intended
  architecture: *"Thunder is the identity gateway — downstream apps (cityzen) call this instead of
  running their own Supabase auth client."*
- Thunder One's BFF proxy is already built for this. `src/app/api/proxy/[...path]/route.ts:41-42`
  reads cookie `to_at` and forwards it as `Authorization: Bearer` on top of `x-api-key`.
- Thunder_Core already has Bearer verification: `getApiAuth` (`src/lib/api-utils.ts:18-50`) calls
  `supabase.auth.getUser(token)` and throws `Unauthorized` when the token is absent or invalid.

Two gaps break the chain:

1. **Nothing ever sets the `to_at` cookie.** Grepping the frontend finds exactly one reference —
   the proxy that *reads* it. `src/features/auth/services/auth.service.ts` already POSTs to
   `/auth/login`, but its own comment says "No backend exists yet", written before the Core
   endpoint landed, and it expects an `AuthUser` shape the endpoint does not return.
2. **The media API has no concept of a user.** `src/middleware.ts` short-circuits every path
   starting with `/api/`, so its Supabase Auth + RBAC gate never runs for these routes. The media
   endpoints authenticate with `requireAppKey`/`requireMediaApp` (`src/lib/core/media.ts`), which
   establishes a *tenant*, never a person. `p_actor_id: null` is consequently hardcoded at four
   call sites: `publications/route.ts:76` (POST) and `:106` (PATCH),
   `publications/[id]/content/route.ts:29` (PUT), `publications/publish-single/route.ts:33` (POST).

## Decision

**Log in through the Thunder gateway, carry the resulting Supabase JWT on existing headers, and
have the media API verify that JWT to resolve a real actor — optionally, never as a requirement.**

Concretely:

1. Thunder One gets a **server-side login route handler** of its own (not the generic proxy). It
   calls Core `POST /api/core/v1/auth/login`, then sets `access_token` into the `to_at` cookie as
   `httpOnly`. The generic proxy cannot do this — it pipes a response body and cannot set cookies,
   and an `httpOnly` cookie cannot be set from client JavaScript.
2. The proxy forwards `to_at` as `Authorization: Bearer` on every Core call. **Already implemented;
   no change.**
3. Thunder_Core gains a lean helper that verifies the Bearer token via `supabase.auth.getUser` and
   returns `user.id` **or `null` when no token is present**. It does not resolve a role and does
   not construct an admin client, so it stays far cheaper than `getApiAuth`.
4. That helper replaces the hardcoded `p_actor_id: null` **at the activate/publish call site only**.
5. `media_publication_get` is extended to return `published_by` together with a display name joined
   from `public.users`, so the UI can render it. The RPC does not expose it today.

### Why optional rather than required

Making a user token mandatory would break every existing consumer of these endpoints in one step —
devices and players authenticate with a Bearer *device* token, and app-key-only integrations exist.
Absent token yields `null`, which is byte-for-byte today's behaviour. Attribution degrades to
"unknown"; nothing stops working. This also means the change can ship before every caller logs in.

### Why verify the JWT instead of trusting a header

The entire value of `published_by` is that it can be believed. Accepting a caller-supplied user id
on the strength of the app key means anyone holding that key can attribute a publish to anyone —
an audit field that is trivially forged is worse than an empty one, because it invites trust it has
not earned. Verification also guarantees the FK to `public.users` is satisfiable, since the id comes
from the identity provider rather than from the caller.

## Options rejected

**Trust a caller-supplied `x-user-id` header.** One line of backend work, and defeats the purpose —
see above. Rejected on integrity, not on cost.

**Stop bypassing `/api/*` in `src/middleware.ts` and let the existing RBAC gate cover the media
API.** Architecturally the tidiest end state, and the largest blast radius available: device and
player traffic carries a Bearer *device* token that the Supabase gate would reject, and every other
API consumer changes behaviour at once. Rejected for this change; revisit only as a deliberate
migration with device auth handled first.

**Add `@supabase/supabase-js` to Thunder One and authenticate in the frontend.** Contradicts the
gateway architecture already documented in the Core login route, adds a dependency for something
one endpoint already does, and puts Supabase credentials into a second app.

## Scope of this change

In: publish/activate attribution, exposing `published_by` through
`media_publication_get`, displaying it in the UI, and a working login that sets `to_at`.

Out, deliberately: attributing draft edits. `media_publication_upsert` does not reference
`p_actor_id` in its body at all and there is no `updated_by` column, so edit attribution needs its
own column and RPC change. It is a separate decision, not a smaller version of this one.

## Deferred, with known ceilings

- **No refresh-token flow.** `to_at` holds the access token; when it expires the user silently
  reverts to unattributed. Upgrade path: store `refresh_token` alongside and refresh in the login
  route handler. Acceptable now because a missing token already degrades safely to `null`.
- No refresh-token flow (above).

## Login is mandatory

Decided 2026-08-05: the app is gated behind login. Without a guard, operators would keep working
unauthenticated and `published_by` would stay NULL, making this change cosmetic. An unauthenticated
request to any dashboard route redirects to `/login`; a successful login lands on `/` (Overview).

**This must be implemented in `src/proxy.ts`, not `src/middleware.ts`.** Next.js 16.2 (the version
in `node_modules`) deprecated and renamed the `middleware` file convention to `proxy`
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). The file
exports a function named `proxy` (or a default export) plus an optional `config.matcher`.

The guard checks only for the *presence* of the `to_at` cookie. It does not verify the JWT, because
per that same doc the proxy is meant to run detached from application code and may be deployed to a
CDN edge. Presence is enough to route a human to the right screen; the real enforcement is that
Thunder_Core verifies the token on every call, and an invalid token simply yields `published_by =
null` rather than false attribution.

## Verification required before this is called done

Per the project's standard, `tsc`/`lint` passing is not verification. This must be exercised through
the browser against a real backend: log in as a real user, publish a publication, then confirm
`media_core.publications.published_by` holds that user's id on prod and that the UI renders the
name. Note that the deployed `thundercore.vercel.app` runs the repository default branch
(`develop`); backend changes on a feature branch are not live until merged.
