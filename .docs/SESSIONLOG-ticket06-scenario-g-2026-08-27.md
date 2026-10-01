# SESSIONLOG — ticket 06 scenario G closed (2026-08-27)

Continuation from `/private/tmp/HANDOFF-layouts-continuation-2026-08-27.md`, item 1 of the
recommended order. No application code touched this session — a develop-only DB probe plus doc
updates.

## What scenario G is

Ticket 06's last residual (see `SESSIONLOG-ticket06-drift-indicator-2026-08-27.md` → "NOT verified"):
a composition Publication in `draft` that *would* be drifted if active must show **no** drift
indicator. Proven only by `publication-drift.check.mts` until now, because develop has no natural
composition draft — all current drafts are `image`.

The guard is client-side: `publicationDrift()` in
`src/features/media-workspace/publications/publication-drift.ts` returns `[]` when
`status !== "active"`, before it ever looks at `drift_check`. `media_publication_get` still sends a
populated `drift_check` for a draft that has a prior snapshot (migration
`20260827120000_republish_and_drift_read.sql:139` nulls it only when `composition_id IS NULL OR
snap.id IS NULL`), so this is a real user-layer test of the client gate.

## Probe (develop `ftfmokgphewzyxzwjitv`)

The one composition Publication on develop, `7b6cb708-bceb-4a0d-b266-a5e10e1f821e`
("Browser Verify Ticket 04 v2 Layout 2026-08-26", Composition `af896984-…`, Zones `Main` + `Side`
both bound to Playlist "Boss test" `2ff237ff-…`).

Setup (direct `UPDATE`, approved in chat; auto-mode classifier blocked the MCP write until then):

```sql
update media_core.playlists set revision = revision + 1
  where id = '2ff237ff-115b-4fab-8577-91c558bc2e57';         -- 12 -> 13
update media_core.publications set status = 'draft'
  where id = '7b6cb708-bceb-4a0d-b266-a5e10e1f821e';         -- active -> draft
```

`media_publication_get` then returned `drift_check` with both Zones `recorded_revision` 12 vs
`live_revision` 13, `composition_revision` 2 = 2, `layout_updated_at` identical — i.e. a payload the
client would render as two playlist bullets **if** the row were active.

## Verified — browser, run by the operator against develop

`/media-workspace/publications/7b6cb708-bceb-4a0d-b266-a5e10e1f821e`:

- page rendered, `Status: draft`, `Type: composition`
- **no "มีการแก้ไขหลังเผยแพร่" card**
- no "เผยแพร่ซ้ำ" button
- no `Main` / `Side` / "Boss test" bullets

Screenshot supplied. **Pass** — the `status !== "active"` guard holds at the user layer.

## Restored immediately after

```sql
update media_core.playlists set revision = 12
  where id = '2ff237ff-115b-4fab-8577-91c558bc2e57';
update media_core.publications set status = 'active'
  where id = '7b6cb708-bceb-4a0d-b266-a5e10e1f821e';
```

Read back: `status active`, live revision 12 = newest recorded revision 12 → not drifted, exact
prior state. develop is clean.

## Docs updated

- `.docs/SESSIONLOG-ticket06-drift-indicator-2026-08-27.md` — "NOT verified" G entry struck through
  and marked CLOSED; "a PR opens as Draft" line replaced (G no longer the blocker)
- `docs/layouts/tickets/06-drift-indicator.md` — Status line rewritten to reflect built + verified

## Effect on the handoff

Handoff item 1 done. Item 2 (push + PR) no longer forced to Draft *by scenario G* — the remaining
residual is the `republish` route never hit in isolation, which is a smaller note, not a blocker.
The R0 items (ticket 07 production apply, ticket 17 threshold) are untouched.

## Not committed

Only the two doc files changed. Leave staging/commit to the push step (handoff item 2), same as the
prior session left `1dac6c5` / `361c428` unpushed.
