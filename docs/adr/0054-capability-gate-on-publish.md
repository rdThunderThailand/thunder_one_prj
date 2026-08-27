# Composition publishing proceeds without device-capacity enforcement

**Status:** accepted · **Date:** 2026-08-27 ·
**Supersedes:** `0044-multi-zone-layout.md` §11 ·
**Related:** `0045-publication-snapshot-materialization.md` §8 ·
`0049-composition-layout-with-content.md` §7 · `0053-republish-in-place.md`

## Context

Publishing a Composition — a Layout with content bound per Zone, materialized into a snapshot and
delivered to the player as `zones[]` — is a requirement of the current phase. ADR 0044 §11 attached
a second requirement to it: that no Composition reach a Media Device which has not reported that it
can render one. The two were treated as a single feature. They are not, and holding them together
stops the first from shipping.

**The publish contract** is a server-side question, answerable today: does activation materialize a
snapshot of the bound Zones, and does the job payload carry `zones[]`? Every input it needs is
already in the database, and tickets 05 and 10 are the whole of the work.

**Device-capacity policy** is a question about hardware nobody has measured. `max_video_zones` — how
many Zones containing video a build can decode concurrently — is the number a gate would compare
against, and ADR 0044 §11 states plainly that each build "hardcodes its number until measured on
real hardware". That measurement has not been taken. There is no implementation plan on the player
side for capability reporting. No real player has reported capabilities. On `develop`, the only
non-null `player_capabilities` value was written by ticket 07's SQL probe; it is evidence of the
schema/RPC contract, not of player reporting. Production does not yet have the column.

Enforcing the policy on that evidence produces two bad outcomes and no good one.

**Unknown-fails blocks the entire fleet.** §11's "unknown counts as failing" is right in principle,
and applied on day one to a fleet in which every device is unreported it refuses every Composition
publish there is. A gate that can only answer no is not protection; it is an outage with a
rationale.

**A manual override converts a reported capability into an operator's guess.** The escape hatch
designed to relieve exactly that — an earlier draft of this ADR specified one, a
`public.assets.capability_override` set from the wizard at the point of refusal — restores
publishing by asking a human to assert a number that the build itself hardcoded without measuring.
The gate would then be enforcing guesses against guesses while presenting the result to the operator
as a capability check. Worse than no gate, because it looks like one.

## Decision

**The publish contract ships. Device-capacity policy is deferred.**

1. A composition Publication activates and materializes its snapshot as ticket 05 built it, and the
   job payload carries `zones[]` as ticket 10 will build it. Neither waits on capability.
2. `required_video_zones` is not computed. Nothing counts video Zones for the purpose of gating.
3. `max_video_zones` is not read to decide any publish.
4. There is no `POST /media/publications/capability-check` and no `media_capability_check` function.
5. Step 3 of the publish wizard shows no capability warning.
6. Step 5 does not block on device capacity.
7. `publish-eligibility.ts` gains no capability row; its positional check array and `gateChecks` are
   unchanged.
8. There is no `capability_override` column, no override UI, and no override policy. This is not
   deferred-but-designed — it is withdrawn. If a gate ever exists, what may override it is decided
   then, from real use cases.
9. `public.assets.player_capabilities` and the `capabilities` argument on `media_device_profile_set`
   (ticket 07, applied to `develop`) remain as groundwork. They accept and store whatever a player
   sends. **No publish semantics read them.** `media_heartbeat`'s widened `profile_required` also
   remains: prompting a device to report costs nothing and accumulates the evidence the deferred
   decision will need. **Ticket 07 has no publish semantics, but its production apply is now a schema
   prerequisite for ticket 16** — `develop` and production hold different bodies of
   `media_heartbeat` (production has neither the column nor the capabilities clause, and still the
   two-argument `media_device_profile_set`), so ticket 16's `CREATE OR REPLACE` cannot be written to
   satisfy both. Applying it stays **R0** and needs its own approval; it is a schema ordering fact,
   not a reversal of this decision.
10. Turning capacity enforcement on later **requires a new ADR that supersedes this decision**,
    followed by reactivating or replacing ticket 08. There is one route and it starts with the ADR:
    ticket 08 is deferred *by* this decision and cannot re-authorise itself. It is not a flag for
    someone to flip.

## Accepted consequence

A Composition may be published to a Device that cannot decode all video Zones
concurrently. Playback may stutter, drop video, or fail on that Device. This
rollout risk is knowingly accepted until player-reported capacity is implemented
and measured on real hardware.

## What this does not relax

Deferring `max_video_zones` removes one guard. Every other guard on the composition publish path
stands unchanged, and none of them depends on a device capability:

- The Composition must be `active`, and complete — every Zone of its Layout bound.
- The snapshot is immutable once written (ADR 0045 §1).
- The target Device set is resolved exactly once per activation and validated and inserted against
  that same set inside one transaction (ADR 0045 §8).
- The equal-priority overlap block still refuses a conflicting composition Publication (ADR 0044 §8,
  ticket 09).
- The **Layout ↔ target geometry fit rule** (ADR 0044 §4) is unaffected by this deferral and has
  nothing to do with decoding — it compares a Layout's declared orientation and aspect ratio against
  the target Device's own reported geometry. It is **ticket 16**, which this ADR creates precisely so
  that deferring capacity does not quietly take geometry with it: before ADR 0054, §4's rule had no
  ticket of its own. It lands in two stages, and the distinction matters:
  - **A Device whose reported geometry is known not to fit is refused by ticket 16.** That is the
    protection, and it is not deferred by anything.
  - **A Device that has never reported geometry warns and still publishes** until a fleet readiness
    threshold is met — §4 says unknown geometry fails, and enforcing that today would refuse 8 of 12
    production Devices. ADR 0044 §4 carries the staged exception; ticket 17 holds the flip.
- Tenant isolation is still enforced inside every RPC.
- The flat (non-composition) Publication contract is unchanged in every respect.
- `zones[]` still ships with signed URLs and snapshot-only polling.

## Rejected alternatives

**Block unknown Devices now, per ADR 0044 §11 as written.** The principled position, and the one
this ADR supersedes. Rejected on arithmetic rather than on principle: with every device unreported,
"unknown fails" refuses one hundred percent of composition publishes on the day it ships, for a
period nobody can bound, because the event that would end it — a player build that reports — has no
plan and no date.

**Hardcode a server-side `max_video_zones` per platform.** Removes the dependency on the player
reporting. Replaces it with a number invented in this repository for hardware in the field, and ADR
0044 §11's own reasoning already forbids it: the Aurora payload runs three video Zones, so any cap
low enough to be safe on an Android 7 box refuses an existing customer configuration outright, and
any cap high enough to permit it protects nobody.

**An operator override.** Specified in full in an earlier draft of this ADR — a
`capability_override` jsonb on `public.assets`, cleared by a real report, set from the blocked-device
list in the wizard. Rejected for this phase on two grounds. There is no gate left for it to
override, so it would exist only to relieve a block this ADR removes. And its input is an operator's
estimate of a decoder capacity that the build hardcoded and no one measured, which does not become
more reliable for being typed into a form.

**Gate on `app_version`.** Rejected by ADR 0044 §11 and not revisited: there is no `player_platform`
column, and Windows and Android version strings are not comparable to each other or reliably to
themselves. Version is a proxy for the question; capacity is the question.

**Hold Composition publish entirely until capacity can be enforced.** The coherent conservative
option: ship neither half. Rejected because Layout publishing is a requirement of this phase, and
because it converts an unmeasured playback risk on some devices into a certainty of delivering
nothing on all of them.

## Consequences

- Composition publishing is unblocked. Ticket 10 (`zones[]` payload) no longer waits on ticket 08,
  and the critical path becomes **05 → (09, 16) → 10** — ticket 16 being the Layout ↔ target geometry
  fit rule this ADR gives an owner to, so that deferring decoder capacity does not take geometry
  with it.
- Ticket 08 becomes deferred future work rather than a blocker, with prerequisites written into it:
  a real multi-Zone renderer, real capability reporting, a hardware measurement, and a rollout
  policy for devices that have not reported.
- Ticket 07 stays applied to `develop` as groundwork, and its production apply is pulled forward out
  of the enforcement phase: ticket 16 cannot ship to production without it (see Decision 9).
  What is deferred is any rule that *reads* the column, not the column itself. This ADR first tied
  the apply to the enforcement phase on the grounds that a column nothing reads buys nothing; that
  reasoning held only until ticket 16 existed, and ticket 16 now gives the migration a concrete
  schema-ordering purpose — `media_heartbeat` has diverged between environments and ticket 16
  replaces it. The `develop` migration is not rolled back.
- Re-publish (ADR 0053) gains no new refusal, so ticket 06's drift indicator keeps the behaviour it
  was verified with.
- The pre-publish preview (ADR 0051) does not simulate decoding capacity, and it is no longer
  correct to describe production publish as the thing that checks it. Nothing checks it in this
  phase.
- When enforcement is reconsidered, the design work already done is not lost: the counting rule
  (Zones holding at least one item of `kind: video`, not items), the requirement that the check read
  the snapshot that will actually be delivered rather than live bindings re-read in a separate
  statement, and the reuse of the already-resolved target set (ADR 0045 §8) all carry forward into
  ticket 08.
