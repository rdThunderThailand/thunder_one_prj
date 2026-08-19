# 0008 — The frontend learns its tenant from one platform-level session endpoint

## Context

ADR 0007 moved tenant resolution into `requireMediaTenant()`, which intersects the tenants an
application may serve (`tenant_applications`) with the logged-in user's `memberships`. Every
user-facing media route now uses it, and a user with no membership in a served tenant gets a 403.

That is correct but it surfaces badly. A real account (`arttest@thunder.co.th`, zero memberships)
logs in, lands on the dashboard, and every panel fails independently — the app looks broken rather
than closed. The request was to decide access once, at the shell, and send such a user to a page
that says so.

The frontend cannot answer the question itself. "Is this user allowed here" is the intersection of
`tenant_applications` and `memberships`, and ADR 0007 §2 forbids computing tenant client-side. The
existing `GET /core/v1/me/memberships` returns the user's memberships across *all* tenants without
filtering by application, so intersecting it in the browser would duplicate the security logic in
the one place the ADR says it must not live. It is also insufficient on its own: the six
`Executive Demo Tenant` users hold memberships yet must not enter this application, so a non-empty
membership list does not imply access.

So the answer has to come from Core. The only open question was how the frontend asks for it.

## Decision

**Add one platform-level `GET /core/v1/session` that returns the caller's resolved user and tenant.
The dashboard shell calls it once per load; 403 means no access and the user is redirected to
`/no-access`.**

1. **The endpoint is platform-level, not per-application.** It is at `/core/v1/session`, not under
   `/media/`, and contains no application's name. The application is identified by the api key it
   presents, so `requireMediaTenant` resolves whichever app is calling. A second application does
   not add a second route — it calls this one with its own key. (`requireMediaTenant` keeps its
   media-era name for now; nothing in it is media-specific, but renaming it for a second consumer
   that does not exist yet is speculative.)
2. **It replaces the shell's existing `/me` call rather than adding to it.** The dashboard layout
   already fetched `/me` for the Topbar name. Returning user and tenant together makes the guard
   cost nothing: one round-trip instead of one, where a separate access-check route would have made
   it two.
3. **It reuses `requireMediaTenant` verbatim.** The endpoint adds no resolution logic of its own, so
   its answer cannot drift from what the data routes enforce.
4. **The redirect is a courtesy, not a control.** Anyone can skip the `/no-access` page with
   devtools and reach the dashboard; every request they make there still returns 403 from
   `requireMediaTenant`, and the RPC layer still filters by tenant. The boundary is server-side and
   unchanged by this ADR.
5. **It fails open on anything that is not an explicit 403.** A transport failure or a 5xx degrades
   the Topbar to a generic name and lets the user through, matching the behaviour the previous
   `/me` call already had. Failing closed would turn a Core outage into a total lockout, and the
   per-request checks still hold the line.

## Options rejected

**Probe a tenant-scoped data route (`GET /media/tags`) and read its status code.** Costs no backend
change at all, and reuses the same resolver, so it cannot drift either. Rejected because it encodes
the access question as a side effect of a data request: a layout that fetches tags to decide who may
log in is a line nobody can explain a year later, and it silently opens the gate if `tags` is ever
made non-tenant-scoped, with no test failing.

**A dedicated boolean access-check route (`GET /media/me/tenant`).** Semantically honest, but it
leaves the shell making two calls — one for the name, one for the verdict — to answer one question
about one session. Folding both into a session payload is the same amount of backend code and one
fewer round-trip on every dashboard load.

**Intersect `/me/memberships` with the app's tenants in the browser.** No backend change. Rejected
outright: it moves the tenant decision to the client, which ADR 0007 rejected for the same reason,
and it would need `tenant_applications` exposed to the frontend to work at all.

**Carry the tenant as a claim in the access token, resolved once at login.** This is what Auth0
Organizations, Okta and Entra do, and it is the right end state — it removes the two membership
queries from every request and makes the tenant tamper-proof rather than re-derived. Rejected *for
now* because Thunder's tokens are issued by the gateway (ADR 0005) and stamping a tenant into them
means changing token issuance and every consumer's expectations. That is its own ADR, not a
side-effect of this one. The session endpoint is compatible with it: when the claim exists, the
endpoint reads the claim instead of querying, and no caller changes.

**Check at login only, in `POST /api/auth/login`.** One check per session instead of per shell load.
Rejected because a user holding a cookie issued before the check, or navigating directly to a
dashboard URL, would never be checked, and a revoked membership would not take effect until the
next login.

## Findings deliberately not acted on

- **`tenant_applications.role` and `.setting` are not returned.** The columns exist and are the
  natural home for per-application, per-tenant role and configuration, which is what a multi-app
  session payload eventually wants. They are left out because `role` there describes the tenant's
  relationship to the application rather than the user's, and no caller consumes it yet; shipping an
  ambiguous field invites it being read as the user's permission level. ADR 0006's open question
  about role vocabulary has to be settled first.
- **The dashboard layout only re-runs on a full load.** Client-side navigation between dashboard
  routes reuses the layout, so a membership revoked mid-session is not caught by this guard. The
  `NoAccess` component added alongside this ADR — rendered when a publications request classifies as
  `forbidden` — is what covers that case, which is why both layers exist rather than one.
- **`getUserRole`'s `ROLE_PRIORITY` gap** (ADR 0006, ADR 0007) remains untouched. This endpoint does
  not call it.

## Verification required before this is called done

`tsc` passing is not verification. Required:

1. A user with a membership in the served tenant logs in and reaches the dashboard with their name
   in the Topbar, exactly as before.
2. A user with no such membership (`arttest@thunder.co.th`) is redirected to `/no-access` on login
   instead of reaching the dashboard, and is not logged out by it.
3. `/no-access` does not redirect-loop, and its sign-out button returns to `/login`.
