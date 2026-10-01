# SESSIONLOG — tenant scoping (ADR 0007 Phase 1 + ADR 0008), 2026-08-06

Continues the handoff at `/tmp/handoff-thunder-one-2026-08-06-tenant-scoping.md`. Phase 0 (data
consolidation) was already applied and verified before this session started.

## What shipped

**`Thunder_Core` (`feat/thunderOne`), 3 commits — none pushed, none deployed**

| commit | what |
|---|---|
| `acadba9` | migrations 075 + 076 (Phase 0, already applied to prod, files were never committed) |
| `7029f8b` | `requireMediaTenant()` + 22 media routes switched to it (ADR 0007 Phase 1) |
| `9d22462` | `GET /core/v1/session` (ADR 0008) |

**`thunder_one_prj` (`fix/thunderone`), 3 commits — none pushed**

| commit | what |
|---|---|
| `837cffb` | ADR 0007, ADR 0008, plan doc, `.gitignore` for `.backups` |
| `e4345a9` | `getSession()` replaces `getCurrentUserName()`; dashboard layout redirects to `/no-access` |
| `cd844c2` | `forbidden` error kind + `NoAccess` component in the two publications pages |

## Decisions taken (full rationale in the ADRs — do not re-derive here)

- **The frontend asks Core one question, once.** `GET /core/v1/session` returns user + tenant
  together. Two alternatives were rejected in the room: probing `GET /media/tags` and reading its
  status code (opaque, and silently opens if `tags` ever stops being tenant-scoped), and a bare
  boolean access-check route (leaves the shell making two calls to answer one question).
- **The endpoint is platform-level, not per-app.** It contains no application name; the app is
  identified by its api key, so a second app reuses it. This was the direct answer to "do we need
  one of these per app" — no.
- **Tenant-in-the-token is the correct end state and was deliberately deferred.** Auth0
  Organizations / Okta / Entra all resolve tenant at token issuance; Thunder re-derives it with two
  queries per request. Changing that means changing the gateway's token issuance — its own ADR.
- **The `/no-access` redirect is UX, not a security control.** The real boundary is
  `requireMediaTenant` plus the RPC-level tenant filter, both server-side.
- **Fail open on anything that is not an explicit 403.** A Core outage degrades the Topbar to
  "Account"; it must not lock every user out.
- **Two layers kept on purpose.** The shell guard only runs on a full load, so client-side
  navigation after a mid-session revocation is covered by the `NoAccess` component instead.

## Verified

- `requireMediaTenant` diff reviewed line by line against the spec; `media/player/*` confirmed
  untouched and still on `requireMediaApp` (device token, no user).
- `GET /core/v1/session` returns 401 for: no user token, bogus user token, no api key. Checked with
  direct `fetch` against local `:3001`.
- `tsc --noEmit` clean on every changed file in both repos. The one error in
  `publications/route.ts` is pre-existing — confirmed by `git stash` and re-running.
- Browser: a user with membership reaches the dashboard normally; `arttest@thunder.co.th` (zero
  memberships) is refused. User confirmed both, and confirmed the `/no-access` flow after it was
  built.

## Not verified / not done

- **Nothing is deployed.** `thundercore.vercel.app` serves `develop`; all Core work sits on
  `feat/thunderOne`. Production behaviour is unchanged as of this log.
- Neither branch is pushed.
- The 200 and 403 paths of `/core/v1/session` were exercised through the browser only, not by an
  automated check.

## Access impact when this deploys

Thunder One serves exactly one tenant: `Thunder Enterprise Master` (12 active members). Locked out
on deploy: the 5 active members of `Executive Demo Tenant` — including `piyapat@thunder.co.th` —
plus `arttest@thunder.co.th`, which holds no membership at all. Intended, but it is real people.

Note `pichayapa@thunder.co.th` (Enterprise Master, keeps access) is a different account from
`piyapat@thunder.co.th` (Executive Demo, loses access). Easy to confuse.

## Traps hit this session

- **A stale `next dev` served pre-edit route handlers.** After the Phase 1 routes changed, browser
  testing showed a user with no membership still loading and publishing — which reads exactly like a
  failed authorization check. The code was correct; the dev server had been running since before the
  edit. Killing and restarting it made the same request return 401 immediately. Saved as
  `[[restart-thunder-core-dev-server-after-route-edits]]`. Always confirm with a direct `fetch`
  before concluding anything from the browser.
- **`/no-access` inside the `(dashboard)` group would have infinite-looped** — the layout redirects
  there, so it has to live outside that layout. Caught while reviewing the plan, not at runtime.

## Open, ranked

1. **Push both branches, then decide about merging `feat/thunderOne` → `develop`.** Unresolved
   across three handoffs now, and it is what actually deploys everything above.
2. **`memberships.status` is read inconsistently.** `requireMediaTenant` counts only `active`;
   the pre-existing `GET /me/memberships` counts `invited` as well. Two `invited` users in
   Enterprise Master are refused under the new resolver. `active`-only looks right, but the
   disagreement should be settled deliberately.
3. **Tenant-in-token ADR** — see above.
4. `getUserRole`'s `ROLE_PRIORITY` gap; refresh-token flow; `/register` stub; upload cancel/retry;
   content file-type validation; `notificationCount` hardcoded to 13 — all unchanged from the
   previous handoff.

## Not in scope, deliberately

- Tenant switcher UI — cannot occur while the app serves one tenant; the ambiguous branch in
  `requireMediaTenant` is a guard, and prod has zero users with active membership in more than one
  tenant.
- Renaming/moving `requireMediaTenant` out of the media module despite it being platform-generic —
  no second consumer yet.
- `tenant_applications.role` / `.setting` in the session payload — ADR 0006's role vocabulary
  question has to be settled first.
