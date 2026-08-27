# 09 — Equal-priority Composition overlap blocks publish

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §8

**What to build:** two compositions can never contend for one screen. When a Publication being
published overlaps an already-active one at the **same priority**, on the **same Media Device**, and
either side carries a Composition, publishing is refused and the other Publication is named with its window
so the operator can change priority, schedule or targets deliberately. Overlaps at differing priorities
stay the advisory warning they are today — the existing override behaviour is not tightened.

**Blocked by:** 05 — Activation materializes Zones
and records revisions

**Status:** built · migration `Thunder_Core/supabase/migrations/20260827150000_equal_priority_overlap_block.sql`
applied to **develop** and probed (SQL layer: blocking case, flat non-block, differing-priority
advisory shape, `media_publication_activate` raise + rollback all verified) · frontend done,
`publish-eligibility.check.mts` + tsc + eslint clean · step-5 browser verified on develop
(block headline, bullet, Publish disabled) · migration applied to **production**
(`sfiefevtxalqjizdkcsw`, 2026-08-27, R0 approved): `media_schedule_conflicts` and
`media_publication_activate` each one overload, `blocks` field and the activation guard present;
production has 0 composition Publications so the blocking path is inert until one is published ·
**frontend not yet committed** · see `.docs/SESSIONLOG-ticket09-overlap-block-2026-08-27.md` and
`docs/layouts/plan-overlap-block.md`

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
- [x] Post-apply verification (develop + production 2026-08-27): exactly one overload of
      `media_schedule_conflicts` and `media_publication_activate`, `blocks` field and the activation
      guard present in the live definitions, grants unchanged (service_role for activate)
- [ ] Scratch-tenant SQL probe: equal-priority composition overlap blocks; equal-priority flat overlap does
      not; differing-priority composition overlap returns the advisory outcome
- [ ] Verified in the browser at step 5, not only by check files
