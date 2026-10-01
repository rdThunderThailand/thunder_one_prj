# Session log — codec gate, 2026-09-17

Continues from `/tmp/HANDOFF-codec-gate-2026-09-17.md` (previous session). Read
`docs/media-library/plan-codec-gate.md` first — status table and session log there are current
as of this session's end.

## What happened this session

1. Discovered #68/#69/#70 showed GitHub state MERGED but the stack had not actually reached
   `develop` — #69 and #70 merged into intermediate feature branches instead (GitHub does not
   auto-retarget a stacked PR's base unless the old branch is deleted). Opened and merged
   [Thunder_Core#71](https://github.com/rdThunderThailand/Thunder_Core/pull/71) to fix that;
   deleted the stale `feat/codec-parser-63` branch.
2. Prod service-role key rotated (user, confirmed done) — the exposed-key loose end from the
   previous session is now closed. `.env.production.local` still needs deleting once nobody
   needs it as a reference (small housekeeping, not urgent).
3. Applied the #65 migration (`media_video_register` +`p_probe_verdict`,
   `media_asset_get` +`probe_verdict`) to **prod** (`sfiefevtxalqjizdkcsw`/`main`) via MCP
   `apply_migration`, then schema-verified: single 14-arg overload (old 13-arg signature
   correctly dropped), grants correct (`service_role` only).
4. Verified `probe_verdict` appears in a real HTTP response — but only against `develop`
   (local Thunder_Core on :3001, exact `develop` HEAD). Prod HTTP verification was blocked all
   session by an unrelated bug (next item) and was not re-attempted after the fix — **still
   outstanding for the next session** if it matters before #120/#66 land.
5. Chased a red herring: login through thunder_one_prj → Thunder_Core gateway 401'd on prod
   even after the key rotation + redeploy. Root cause was **not** the key — `requireAppKey`
   looks up the caller's `x-api-key` in `public.applications`, and the "ThunderOne" row
   thunder_one_prj's `.env.local` was using only ever existed on the `develop` Supabase branch
   (`ftfmokgphewzyxzwjitv`). Prod (`sfiefevtxalqjizdkcsw`) has its own "ThunderOne" row (seeded
   2026-09-10) under a **different** `api_key`. User updated `.env.local` with the correct prod
   key; login now works.
6. Fixed [Thunder_Core#72](https://github.com/rdThunderThailand/Thunder_Core/pull/72) (Draft,
   not merged): `requireAppKey` threw the same "invalid app API key" message whether the DB
   lookup itself failed or it succeeded with no matching row — split into two distinct messages
   so this class of bug is diagnosable from the error text alone next time.
7. Updated `docs/media-library/plan-codec-gate.md` status table, frontier line, and session log
   to match all of the above.

## Queue for the next session(s) — work through in this order

```
1. Thunder_Core#66 (activation guard)         ─┐  both unblocked now, independent repos,
2. thunder_one_prj#120 (Upload Queue + Detail) ─┘  order between them doesn't matter

   optional, whenever convenient, not a blocker for 1/2:
   - merge Thunder_Core#72 (Draft, api-utils error-message fix)
   - re-verify #65's probe_verdict over HTTP against prod specifically (only develop
     was HTTP-verified this session; prod was blocked by the app-key bug until the
     very end)
   - delete Thunder_Core/.env.production.local (held the now-rotated-away leaked key)

3. Thunder_Core#67 (backfill) — DO NOT START without a human "go" against the #64 count
   (9 of 32 refused, 3 airing, posted 2026-09-16). Still no "go" as of this session.

4. thunder_one_prj#121 (WebP closure) — independent of everything above, held until a
   human schedules it (it's prod writes).
```

Nothing above requires a design decision — #66 and #120 both have settled acceptance criteria on
their tickets and in the plan doc's "What each ticket delivers" section. No `brainstorming` or
`writing-plans` needed to start either; go straight to `systematic-debugging` only if something
breaks, otherwise just build to the ticket.

## Handoff for whoever picks this up

```
Continue codec-gate work. Read docs/media-library/plan-codec-gate.md first (status table +
session log are current as of 2026-09-17), then this file for what changed today.
Frontier: Thunder_Core#66 and thunder_one_prj#120, either order, both unblocked.
Not a blocker: Thunder_Core#72 (Draft) can merge whenever, doesn't touch codec-gate logic.
Do not start #67 without an explicit human "go".
```
