# Re-publish is its own RPC that delegates to activation

**Status:** accepted · **Date:** 2026-08-27 ·
**Extends:** `0049-composition-layout-with-content.md` §7, §11 ·
`0045-publication-snapshot-materialization.md` §1, §3

## Context

ADR 0049 §7 and §11 decide the *behaviour* of drift: a Publication whose Composition, Layout, or any
bound Playlist changed after activation is flagged, and **the action offered is re-publish** — a
fresh snapshot taken in place, the Publication keeping its own id (spec story 30). Ticket 06 has to
put that action behind a button.

No mechanism exists for it. `media_publication_activate` opens with

```sql
IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Already active: publication is not a draft';
END IF;
```

and there is no `republish`, `reactivate`, or revert-to-draft RPC anywhere in `supabase/migrations`.
Ticket 05 exercised the republish path by forcing `status` back to `'draft'` with a direct `UPDATE`
in a scratch tenant — a rehearsal of the snapshot behaviour, not a mechanism an operator can reach.

The obvious move is to relax that guard so activation may run again on an `active` Publication. It
is wrong, for a reason that is invisible from the SQL:

**the `Already active` refusal is load-bearing on the client.**
`usePublishDraft.publishNow` (`src/features/media-workspace/publications/hooks/usePublishDraft.ts`)
catches it and treats it as success:

> A retry after a timed-out publish lands here: the backend refused because the first attempt already
> activated it, so this is a success reaching us late.

Publishing from the wizard is a single request that can time out with the transaction already
committed. The refusal is what makes the user's retry idempotent. Relax it and that retry silently
publishes a second time — a duplicate Job and a duplicate snapshot, from the one path where the user
has the least reason to expect it.

## Decision

**Re-publish is a separate RPC, `media_publication_republish(p_tenant_id, p_publication_id,
p_actor_id)`, which reverts the Publication to `draft` and calls `media_publication_activate` in the
same transaction.**

- `media_publication_activate` keeps its signature, its guard, and its body unchanged. Every
  validation it performs — Composition still `active`, every Zone still bound, at least one Target,
  no synchronized-Channel conflict — applies to a re-publish for free, because a re-publish *is* an
  activation. A Composition made incomplete by a Zone added to its shared Layout (ADR 0049 §10) is
  therefore refused at re-publish with the unbound Zones named, which is the intended outcome.
- No materialization SQL is duplicated. The composition branch written in ticket 05 has exactly one
  copy.
- The refusal is inverted: `republish` accepts only `active`. A `draft` is told to activate instead,
  a `cancelled` Publication is refused outright — cancellation is an operator decision that
  re-publishing would quietly undo.
- The intermediate `draft` state is never observable: the whole call is one transaction and
  `media_publication_activate` takes `FOR UPDATE` on the Publication row, so a concurrent
  `media_job_poll` reads the pre-transaction row and keeps serving the airing snapshot until commit.
- Not restricted to `publication_type = 'composition'`. A flat Publication may be re-published by the
  same rule; nothing in the UI offers it, because ADR 0049 §11 flags only composition Publications.
  A type check here would be a special case earning nothing.

**A Publication may now hold more than one Job and more than one snapshot, and every read must say
which one it means.** `media_job_poll` already does — `DISTINCT ON (pub.id) … ORDER BY pub.id,
pj.created_at DESC, pj.id DESC` — because ADR 0045 §3 anticipated this. `media_publication_get` does
not: it joins `publish_jobs` on `publication_id` with no ordering and reads the result with `SELECT
… INTO`, so with two Jobs it returns an arbitrary one, and with it an arbitrary `job_status` and an
arbitrary per-device delivery table. It is corrected to the same newest-Job rule in the same
migration. `media_publication_download_report`, `media_playback_log` and `media_job_ack` resolve
their Job from the `target_id` the player carries and need no change.

## Rejected alternatives

**Relax the guard in `media_publication_activate`.** The shortest diff, and it breaks the wizard's
timeout-retry idempotence as described above. Nothing at the SQL layer records that the error is an
API the client reads.

**A new `p_allow_republish boolean` parameter on `media_publication_activate`.** Keeps one function
and one call path. Adding a parameter means `CREATE OR REPLACE` mints an overload rather than
replacing, so it needs `DROP FUNCTION` on a function live in production, and every existing caller
has to be re-checked against the new resolution. A separate name costs a migration section and buys
a boundary that reads as what it is.

**Copy the materialization into a standalone `republish`.** Two copies of the branch ticket 05 just
finished verifying, diverging the first time either is touched.

## Consequences

- `POST /media/publications/:id/republish` is added to Thunder_Core. The activate route is untouched.
- Old Jobs and old snapshots are left intact, as ADR 0045 §3 requires: a Job keeps pointing at what it
  delivered. `activated_at` and `published_by` on the Publication are overwritten with the
  re-publish, which is the reading those two fields already have — when this was last put on air, and
  by whom.
- **`media_publication_retry_targets` still operates on every Job of a Publication**
  (`WHERE pj.publication_id = p_publication_id`), so after a re-publish it re-opens targets on the
  superseded Job too. Those targets are never served, because poll only offers the newest Job, and
  they are never displayed, because the corrected `media_publication_get` reads only the newest Job.
  Left as it is: out of ticket 06's scope, and harmless while both of those hold.
