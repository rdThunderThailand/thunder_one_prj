# 09 — Equal-priority Composition overlap blocks publish

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §8

**What to build:** two compositions can never contend for one screen. When a Publication being
published overlaps an already-active one at the **same priority**, on the **same Media Device**, and
either side carries a Composition, publishing is refused and the other Publication is named with its window
so the operator can change priority, schedule or targets deliberately. Overlaps at differing priorities
stay the advisory warning they are today — the existing override behaviour is not tightened.

**Blocked by:** 05 — Activation materializes Zones
and records revisions

**Status:** ready-for-agent

- [ ] `media_schedule_conflicts` returns a blocking outcome, distinct from its existing advisory one,
      for: equal priority + overlapping window + same Media Device + either side carries a Composition
- [ ] Differing-priority overlaps keep today's `would_suppress` / `would_be_suppressed` advisory shape
      and meaning, byte-for-byte
- [ ] Two flat Publications at equal priority behave exactly as they do today — no new block
- [ ] `media_publication_activate` refuses to activate while a blocking overlap exists, inside the
      activation transaction
- [ ] Step 5 renders the block, naming the other Publication and its window; step 4's advisory display
      of non-blocking conflicts is unchanged
- [ ] Recurrence-aware windows are respected — the overlap test uses the same window logic the advisory
      path already uses, not a simplified one
- [ ] `publish-eligibility` gains the blocking-overlap cases in its existing check file
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload of each touched function, grants confirmed with `has_function_privilege`, advisors show
      no new finding
- [ ] Scratch-tenant SQL probe: equal-priority composition overlap blocks; equal-priority flat overlap does
      not; differing-priority composition overlap returns the advisory outcome
- [ ] Verified in the browser at step 5, not only by check files
