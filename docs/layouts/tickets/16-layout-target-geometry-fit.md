# 16 — A Layout is refused a target whose geometry does not fit

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §4
(rule stated there since 2026-08-25; given a ticket of its own, and a staged exception, by
`docs/adr/0054-capability-gate-on-publish.md`)

**What to build:** a composition Publication is refused when a targeted Media Device's **reported**
geometry does not fit the Layout — wrong orientation, or an aspect ratio the Layout was not drawn
for. The operator is warned at step 3 as soon as such a Channel is selected, and the server refuses
it again at activation if the UI is bypassed. A Device that has **never reported** its geometry warns
but still publishes; flipping that to a refusal is ticket 17, not this one.

**Why it exists as a ticket at all:** ADR 0044 §4 defines fit as **two separate rules**. The
*Channel ↔ Media Device* rule already ships — `getDeviceCompatibility` in
`src/features/media-workspace/channels/channel-logic.ts`, backed by `media_screens_list`, blocking on
orientation mismatch and confirming on resolution mismatch. The *Layout ↔ target* rule is marked
"new" in §4 and was never given an owner: it was carried along in the same breath as the §11
capability gate, and when ADR 0054 deferred that gate this rule was left declared but unbuilt. ADR
0054 states explicitly that deferring decoder capacity does **not** relax geometry. This ticket is
what makes that true.

**Blocked by:**
- 05 — Activation materializes Zones and records revisions (the check runs inside the same
  activation transaction, against the same resolved target set)
- **07 — production apply (R0).** Not for its semantics; for its schema. Production has no
  `player_capabilities` column, no capabilities clause in `media_heartbeat`, and still the
  two-argument `media_device_profile_set`, while `develop` has all three. This ticket does
  `CREATE OR REPLACE` on `media_heartbeat`, and one body cannot satisfy both environments. Verified
  read-only on both, 2026-08-27. Sequence: `07 production apply → 16 → 10`.

**Blocks:** 10 — `zones[]` payload. Ticket 10 must not ship before a Device whose geometry is known
not to fit is refused. It does **not** wait on ticket 17: an unprofiled Device receiving a
composition is the same class of knowingly accepted risk ADR 0054 already documents, and gating 10 on
a fleet-wide readiness measurement would rebuild the deadlock ADR 0054 exists to remove.

**Status:** ready-for-agent once ticket 07's production apply is approved.

## Why unknown geometry does not fail here

ADR 0044 §4 says unknown geometry **fails** for Layout-bearing activation. That rule is adopted, and
§4 now carries a staged exception explaining why it is not switched on in one step.

**Measured, read-only, 2026-08-27:** geometry (`orientation` + `screen_width`/`screen_height`) is
complete on **4 of 13** Media Devices on `develop` and **4 of 12** on production. Refusing unknown
geometry today blocks 8 of 12 production Devices from every composition on day one — the same shape
of failure ADR 0054 rejected for capability, at 67% instead of 100%.

**And the recovery path does not exist yet.** `media_heartbeat` computes

```sql
'profile_required', (v_row.os_version IS NULL AND v_row.machine_name IS NULL)
                    OR v_row.player_capabilities IS NULL
```

Geometry appears nowhere in it, and the identity half is an `AND`. A Device missing only
`orientation` or its dimensions is **never re-prompted**. The fleet looks self-healing only because
every geometry-less Device today also happens to be missing its identity fields — a property of the
current data, not a contract. **Widening that flag is this ticket's job**, and it is what makes the
flip in ticket 17 possible at all.

## Acceptance criteria

- [ ] A pure module computes fit from a Layout's declared geometry and a Device's reported geometry:
      orientation compatibility, and aspect-ratio compatibility against `layouts.aspect_ratio`.
      Plain functions over plain data, with a `.check.mts` beside it — house style, no runner
- [ ] Resolution is **not** compared at the Layout level. A Layout declares `aspect_ratio`, not a
      resolution (§4); `reference_resolution` exists on `layouts` for the editor's pixel readout
      (ticket 11), not as a publish-time comparison
- [ ] `media_publication_activate` refuses a composition Publication whose resolved target set holds a
      Device with **reported** geometry that does not fit, inside the activation transaction, before
      anything is written
- [ ] A Device with **no** reported geometry does not block activation in this ticket — it warns at
      step 3 and publishes. Ticket 17 owns the flip
- [ ] It reuses the target Device array activation already resolves exactly once and never re-queries
      Channel membership (ADR 0045 §8)
- [ ] The refusal names the offending Media Devices and the reason, in the shape activation's existing
      refusals use (`Invalid input: …`, names aggregated)
- [ ] **`media_heartbeat`'s `profile_required` is widened to include missing geometry** — a Device
      lacking `orientation` or `screen_width`/`screen_height` is re-prompted. `CREATE OR REPLACE` is
      safe: the signature does not change. Watch the existing identity clause — it is
      `os_version IS NULL AND machine_name IS NULL`, so a partial profile already slips through it
- [ ] A check covers the **partial profile** cases explicitly: identity present + geometry missing;
      identity present + capabilities present + geometry missing; geometry present + identity
      missing. Each must still be prompted. This is the case that silently breaks recovery, and the
      only reason today's fleet appears to heal is that no Device is in it yet
- [ ] Step 3 warns as soon as a selected Channel contains an unfitting **or** unprofiled Device,
      naming the Devices and which of the two it is, and does not block progress
- [ ] Step 5 blocks publishing while a known-unfitting Device is targeted, showing the same detail
- [ ] A Publication with no Composition is never checked — the flat path is unchanged
- [ ] `publish-eligibility.check.mts` covers the fit-block cases alongside its existing branches
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe: a fitting Device publishes; a wrong-orientation Device is refused by
      name; an unprofiled Device warns and still publishes; a Device with a partial profile receives
      `profile_required: true`
- [ ] Verified in the browser at steps 3 and 5, not only by check files

## Explicitly not this ticket

- The flip to refusing unprofiled Devices, and the readiness threshold that gates it — **ticket 17**.
- Decoder capacity / `max_video_zones` — deferred by ADR 0054, ticket 08.
- The Channel ↔ Media Device fit rule — already shipped, untouched here.
- Any operator override. ADR 0054 withdrew that design; if geometry ever needs one it is decided on
  its own evidence, not inherited.
