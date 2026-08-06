# 0007 — Tenant scoping: app key bounds the scope, the logged-in user's membership picks within it

## Context

ADR 0005 put Thunder One behind a login and ADR 0006 made the Topbar show the real logged-in user.
Neither changed what a logged-in user is allowed to *see*: every publication, media asset, playlist
and channel the app returns is still selected by a tenant that has nothing to do with who logged in.

The request that prompted this ADR was "whatever tenant the logged-in account belongs to, scope
publications and assets to that tenant." Taken literally and shipped today, that change empties the
application for every user. The facts below are why, and all of them were read off prod rather than
inferred.

- **Tenant is resolved from the app key, not from the person.** `requireMediaApp()`
  (`Thunder_Core/src/lib/core/media.ts:11-27`) looks up `applications.tenant_id` for the presented
  `x-api-key` and hands that `tenantId` to every media route, which passes it as `p_tenant_id` into
  the RPC. Tenant isolation therefore already exists and is already enforced in the RPC layer — it
  is bound to the *application*, and the user's identity never enters the decision.
- **Media data lives in the `media_core` schema, not `public`.** `publications`, `media_assets`,
  `playlists`, `channels`, `campaigns`, `schedules`, `publish_jobs`, `playback_logs`,
  `playlist_items`, `tags` and `brands` each carry `tenant_id`. The join tables
  (`publication_targets`, `publication_tags`, `channel_devices`, `publish_job_targets`) do not; they
  inherit scope through their parent row.
- **The data and the people are in different tenants, with no overlap.** The `Thunder One`
  application is bound to tenant `ThunderOne` (`11110000-…-0001`), and 100% of the 30 publications
  sit there. `memberships` contains **zero** rows for that tenant: all 20 memberships belong to
  `Thunder Enterprise Master` (14) and `Executive Demo Tenant` (6). So the tenant holding the data
  has no members, and every real user belongs to a tenant holding no data.
- **`users.default_tenant_id` is `NULL` for every user.** The field `/me` returns — the obvious
  candidate for "which tenant is this person in" — is unpopulated across the table, so it cannot
  drive resolution today.
- **The only device belongs to `Thunder Enterprise Master`, while the channel targeting it belongs
  to `ThunderOne`.** The `channel_devices` link therefore already crosses a tenant boundary in
  production. Whatever else is true, the current tenant assignment is not internally consistent.
- **The platform already has a many-to-many app↔tenant mechanism that Thunder One does not use.**
  `public.tenant_applications` maps applications to the tenants they serve, and the `CityZen`
  application has rows for two different tenants. `Thunder One` has no row at all; it relies solely
  on the single `applications.tenant_id` value.
- **The plumbing to know *who* is calling already exists.** The BFF proxy forwards both `x-api-key`
  and the user's `Authorization: Bearer <to_at>`, and `getOptionalActorId()`
  (`Thunder_Core/src/lib/core/media.ts:57-90`) already verifies that token against Supabase and
  returns the user id. Nothing new has to be built to identify the caller.

Read together: `ThunderOne` looks like an artifact of provisioning the application, not a customer
tenant. The users are elsewhere, the device is elsewhere, and only the media rows and the app
binding were ever placed in it.

## Decision

**The app key bounds which tenants the application may serve; the logged-in user's membership
selects which of those tenants the request runs against. `tenant_id` is never accepted from the
client.**

Concretely:

1. **Scope comes from `tenant_applications`.** The set of tenants `Thunder One` may serve is the
   rows in `public.tenant_applications` for its application id — the mechanism `CityZen` already
   uses — rather than the single `applications.tenant_id` value.
2. **Selection comes from verified membership.** The user's id is taken from the *verified* Bearer
   token (never from a header or body field), their `memberships` are read, and the request tenant
   is the intersection of those memberships with the app's permitted set.
   - Exactly one tenant in the intersection → use it.
   - More than one → use `users.default_tenant_id` if it is in the intersection; otherwise reject
     with an explicit error rather than guessing. A tenant switcher is deliberately not built now:
     after the consolidation below the application serves exactly one tenant, so the intersection
     can never exceed one, and building a switcher for a case that cannot yet occur is speculative.
   - Empty intersection → `Permission denied`. A user with a valid token but no membership in a
     tenant this app serves gets nothing, which is the point.
3. **Device and player routes keep resolving tenant from the app key.** `/media/player/*` is called
   by hardware with a device token and no user; there is no membership to consult. Forcing a user
   context there would break playback for the sake of uniformity.
4. **The media data is consolidated into `Thunder Enterprise Master`.** All rows currently carrying
   `tenant_id = ThunderOne` in the eleven `media_core` tables are re-pointed at
   `22222222-2222-2222-2222-222222222222`, where the 14 real users and the only device already live.
   `Thunder Enterprise Master` holds **zero** `media_core` rows today, so nothing collides. This is
   what makes the cross-tenant `channel_devices` link correct rather than merely tolerated, and it
   means no membership has to be invented to grant people access to their own data.
5. **Only `memberships.status = 'active'` counts as access.** An invitation that has not been
   accepted is not access, so `status = 'invited'` is excluded from the intersection in point 2.
   `GET /core/v1/me/memberships` previously listed `invited` rows as well; it now filters to
   `active` so the two paths cannot disagree. Consequence: `/me/memberships` no longer surfaces
   pending invitations. That costs nothing today — acceptance runs off an emailed token against
   `user_invitations`, not off this list — but if a "your pending invitations" view is ever built,
   it needs its own endpoint reading `user_invitations`, not this one.

### Why consolidate rather than grant membership in `ThunderOne`

Granting the 14 users membership in `ThunderOne` is additive and trivially reversible, and it was
the cheaper option. It was rejected because it fixes the symptom while preserving the incoherence:
the device would still sit in a different tenant from the channel that targets it, so targeting and
publishing would keep crossing a boundary that the whole point of this ADR is to make meaningful. It
also cements `ThunderOne` as a tenant whose only members were added so that a lookup would succeed.

The cost of the safer option is a data migration; the cost of the cheaper option is a permanent lie
about who owns what. The row counts (565 across eleven tables, all in one tenant, none in the
destination) make the migration small enough that the trade favours coherence.

## Options rejected

**Resolve tenant purely from the user's memberships, ignoring the app key.** Simpler, and it is what
the original request literally described. Rejected because it deletes a security boundary that
currently exists for free: with app-key scoping, a stolen user token cannot be replayed against this
application to reach a tenant the application was never provisioned for. Keeping the app key as the
outer bound costs one extra lookup and preserves that property.

**Send `tenant_id` from the frontend, resolved once at login.** Removes a per-request membership
lookup. Rejected outright — it makes the tenant boundary a client-supplied value, which means any
caller who can craft a request can read any tenant's media. This is the one thing that must never be
built regardless of how convenient it is.

**Keep single-tenant binding: one deployment per tenant.** Genuinely viable, requires no code at all,
and is safe by construction. Rejected because it cannot answer "users from different tenants using
the same deployment", which is the behaviour that was asked for.

**Populate `users.default_tenant_id` and read only that.** One column, one lookup, no membership
join. Rejected because it is unenforced: a `default_tenant_id` pointing at a tenant the user has no
membership in would silently grant access. Membership is the fact; the default is at most a
tie-breaker among memberships, which is exactly how it is used above.

## Findings deliberately not acted on

- **`channel_devices`, `publication_targets`, `publication_tags` and `publish_job_targets` carry no
  `tenant_id`.** They inherit scope from their parent, which is defensible, but it means a bug in a
  parent's tenant assignment cannot be caught at the join table. Not changed here.
- **`getUserRole`'s `ROLE_PRIORITY` gap** (ADR 0006, "Findings deliberately not acted on") is still
  open and is now adjacent: this ADR introduces a second consumer of `memberships`. The tenant
  resolution added here deliberately reads memberships directly and does not call `getUserRole`, so
  it does not inherit that bug.
- **No permission gates.** This ADR decides *which tenant's* data a user sees, not *what they may do*
  with it. Every authenticated user of a tenant still gets every action, as noted in ADR 0006.

## Verification required before this is called done

`tsc` and `lint` passing is not verification. Required:

1. After the data move, log in as a real user and confirm the publication list, media assets and
   channels are the same rows that were visible before the move — the consolidation must be a no-op
   from the UI's point of view.
2. Confirm the device still receives its publish jobs after re-tenanting (`publish_jobs` is polled by
   live hardware; this is the one table where the move is observable outside the app).
3. Confirm a user with a valid token but no membership in the served tenant is refused, rather than
   silently receiving another tenant's rows.
