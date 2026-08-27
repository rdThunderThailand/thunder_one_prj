# Layout ↔ target geometry fit warns and never refuses

**Status:** accepted · **Date:** 2026-08-27 ·
**Supersedes:** `0044-multi-zone-layout.md` §4 (the enforcement half of the Layout ↔ target rule,
including the staged exception added 2026-08-27) ·
**Amends:** `0054-capability-gate-on-publish.md` on two points, both corrected in place there —
its "What this does not relax" bullet asserted that a Device whose reported geometry is known not to
fit is refused by ticket 16 (nothing on the geometry path refuses now), and its Decision 9 asserted
that prompting via `profile_required` accumulates evidence (no player build reads the flag) ·
**Related:** `0045-publication-snapshot-materialization.md` §8 · `0049-composition-layout-with-content.md`

## Context

ADR 0044 §4 defines fit as two separate rules. The *Channel ↔ Media Device* rule ships and is
untouched here. The *Layout ↔ target* rule — a Layout declares an `aspect_ratio`, so the only
comparison it can make against a Device is orientation and aspect-ratio compatibility — was declared
in §4 and given an owner (ticket 16) by ADR 0054, which stated the enforcement half was "in force as
written". Writing the ticket forced two questions §4 never answered: which reported values *are* the
Device's geometry, and what "compatible" means numerically. Both answers turn out to be constrained
by data, not by principle.

### Geometry has two writers and they disagree on real devices

`media_device_profile_set` writes `orientation`, `screen_width`, `screen_height`, `screen_ratio`,
`dpi_scale` at boot. `media_heartbeat` writes `screen_dimension` and `screen_ratio` every sixty
seconds. **`screen_ratio` is written by both**, so the heartbeat's value wins in practice. The
player contract (`.docs/player_contract_timeline.md`) already marks `screen_dimension` and
`screen_ratio` deprecated in favour of the split integer fields.

Measured on production, 2026-08-27 — all four profiled Devices heartbeating that day:

| Device | `orientation` | `screen_width`×`screen_height` | `screen_ratio` | `screen_dimension` |
|---|---|---|---|---|
| Screen 01, 02 | landscape | 1920×1080 | 16:9 | 1920x1080 |
| Screen 03 | landscape | **1920×1008** | 16:9 | **1920x1080** |
| Screen 04 | landscape | **1920×1200** | **9:16** | **1080x1920** |

`develop` shows the same two shapes. Two facts follow.

**The profile call reports the work area, not the panel.** `1008 = 1080 − 72`: a Windows taskbar.
A Device whose panel is exactly 16:9 reports a 1.905 aspect ratio.

**The two sources contradict each other outright.** Screen 04 reports `orientation: landscape` with
`1920×1200` from the profile call, and `1080x1920` / `9:16` from the heartbeat. There is no
reconciliation rule, and requiring the two to agree would reclassify two of four profiled production
Devices as unprofiled on day one.

The shipped Channel ↔ Media Device rule already chose between them: `media_screens_list` composes
`resolution` as `screen_width || 'x' || screen_height` and reads `orientation`, ignoring
`screen_ratio` and `screen_dimension` entirely.

### An exact aspect comparison refuses working hardware

Against the one Layout that exists (`16:9`), an exact normalized match refuses Screen 03 (taskbar,
7% off) and Screen 04 (a 16:10 panel, 10% off) — **two of the four profiled production Devices**,
neither for a reason an operator could act on. That is the shape of failure ADR 0054 was written to
avoid, at 50% instead of 100%.

### And the unknown half was already unenforceable

§4's "unknown geometry fails" was already suspended by its own staged exception: geometry is
complete on 4 of 13 Devices on `develop` and 4 of 12 on production, and `media_heartbeat` never
prompts for it — `profile_required` is `(os_version IS NULL AND machine_name IS NULL) OR
player_capabilities IS NULL`, in which geometry appears nowhere and the identity half is an `AND`,
so a partially profiled Device is never re-prompted. Enforcement therefore had **no half in force**:
the known-mismatch half would refuse working screens, and the unknown half was already deferred to
ticket 17.

### `profile_required` is not a recovery path, because nothing reads it

An earlier draft of this ADR made the widening of `profile_required` a decision of this phase, on
the grounds that prompting costs nothing and starts the evidence accumulating. **Reading the player
sources shows that claim is false, and it is corrected here rather than left standing.** Neither
build looks at the heartbeat response body:

- Windows `PlayerApiClient.SendHeartbeatAsync` returns `bool` and reads the body only on failure, to
  log it (`Ads_Manager_WindowApp-main/Services/PlayerApiClient.cs:60`). `HeartbeatService` uses that
  boolean solely to set the status string to `"Online"` (`Services/HeartbeatService.cs:32`).
- Android keeps `httpStatusCode` from the heartbeat and nothing else
  (`playerapi/PlayerApiClient.kt:84`); the caller logs success (`MainActivity.kt:1595`).

`device-profile` is sent on **the players' own lifecycle and UI triggers only, never in response to
a heartbeat**: Windows on `ContentRendered`, on a settings change, and on a debounced display change
(`App.xaml.cs:90`); Android on entering the player shell, which several paths reach
(`MainActivity.kt:297`, called from four call sites). So coverage is not frozen until a reboot — a
monitor change or a settings edit moves it too — but **nothing the server does can ask for it**.

That is the property that matters here. `profile_required` has no reader on either platform, so
widening it changes a value nobody fetches, and no server-side change can create a recovery path on
its own: the player half has to exist, and it does not.

A second finding from the same reading, recorded because it independently supports Decision 1
below: Windows computes `orientation` from width and height rather than storing it separately
(`Models/DeviceInfo.cs`), and **neither build sends `screen_ratio` at all** — both send an
`aspect_ratio` key, which is not in the route's schema and is dropped. Every `screen_ratio` value in
the database therefore comes from the heartbeat, never from the profile call. Deriving orientation
from the dimensions and ignoring `screen_ratio` matches what the players actually do.

## Decision

**The Layout ↔ target geometry fit rule is advisory in this phase. It warns; it never refuses.**

1. **Fit is computed from the profile fields only** — `orientation` is derived from
   `screen_width`/`screen_height` rather than read from the `orientation` column, so a
   Device whose columns disagree cannot produce a contradiction the check has to arbitrate.
   `screen_ratio` and `screen_dimension` are not read. This matches `media_screens_list` and the
   player contract's own deprecation.
2. **Geometry is "reported" only when `screen_width` and `screen_height` are both present.**
   Anything else is unknown, not unfitting.
3. **Orientation compatibility:** a Device is landscape when `width > height`, portrait when
   `height > width`, and square when equal. A square Device fits any Layout. Otherwise the Layout's
   orientation, derived the same way from its parsed `aspect_ratio`, must match.
4. **Aspect compatibility is a symmetric ratio within a 15% band:**
   `max(deviceAR, layoutAR) / min(deviceAR, layoutAR) <= 1.15`. The number is chosen from the
   measured fleet, not from theory: it must accept a taskbar-cropped 1920×1008 (1.071) and a 16:10
   panel (1.111), and reject 4:3 (1.333), 21:9 (1.313) and any video-wall ratio (16:3 is 3.000).
   It is a tunable constant with that rationale recorded beside it, not a constant of nature.
5. **Nothing blocks.** Step 3 warns as soon as a selected Channel contains a Device that does not
   fit **or** has never reported geometry, naming the Devices and which of the two it is. Step 5
   shows the same warning and does not prevent publishing.
6. **`media_publication_activate` gains no geometry check.** The activation transaction is unchanged
   by this ticket. The equal-priority overlap block (ADR 0044 §8, ticket 09), the completeness and
   tenant checks, and everything else in it stand exactly as they are.
7. **`publish-eligibility.ts` gains no row and no gate.** Its positional check array and
   `gateChecks` are unchanged, as they were left by ADR 0054.
8. **There is no server-side change at all in this phase.** `media_heartbeat` is not modified.
   Widening `profile_required` to cover geometry — and correcting its identity clause from `AND` to
   `OR`, so a partially profiled Device is prompted — is real work and still wanted, but it is half
   of a two-part contract whose other half does not exist. It moves to **ticket 18**, where it ships
   together with the player change that reads the flag and re-sends the profile, so the pair can be
   verified end to end instead of a flag being deployed to production with no reader.
9. **The `screen_ratio` double-write is left in place.** Nothing in this decision reads it, and
   removing it from `media_heartbeat` changes a player contract that still documents the field as
   accepted. Recorded as debt, not fixed here.
10. **Turning enforcement on is ticket 17**, which now owns both halves — refusing a known mismatch
    and refusing unknown geometry — behind one fleet readiness threshold, because both are gated on
    the same condition: enough Devices reporting complete geometry, and a recovery path that
    actually works. Splitting them would invent a dependency between two switches that flip
    together. Ticket 16 builds the module that computes both outcomes; ticket 17 changes what is
    done with them; **ticket 18 is what makes the readiness number movable at all**, and is
    therefore a prerequisite of 17 — but not of 16, and not of 10.

## Accepted consequence

A Composition may be published to a Media Device whose geometry does not fit the Layout: a portrait
panel receiving a landscape composition, or a 4:3 panel receiving a 16:9 one. Zones are stored as
percentages, so the player will render them against whatever frame it has — the composition appears,
distorted in proportion, or rotated against the panel. The operator is warned at step 3 and again at
step 5, naming the Devices. This is a knowingly accepted rollout risk of the same class ADR 0054
accepted for decoder capacity, and for the same reason: the alternative refuses working hardware
today to prevent a fault that is visible, reversible by re-publishing, and harms no data.

## What this does not relax

- The Channel ↔ Media Device fit rule is untouched. `getDeviceCompatibility` still blocks on
  orientation mismatch and confirms on resolution mismatch when a Channel's Devices are chosen.
- Every guard listed in ADR 0054's "What this does not relax" stands, with the single correction
  named in this ADR's header.
- The equal-priority overlap block still refuses a conflicting composition Publication inside the
  activation transaction (ADR 0044 §8, ticket 09, applied to production 2026-08-27).
- A Composition must still be `active` and complete, the snapshot is still immutable, the target set
  is still resolved once (ADR 0045 §8), and tenant isolation is still enforced inside every RPC.

## Rejected alternatives

**Exact normalized aspect match, refusing on any difference.** The literal reading of §4. Rejected
on measurement: it refuses two of four profiled production Devices, one for a taskbar and one for
being a 16:10 panel. Neither operator could do anything about it, and neither screen would actually
render the composition badly.

**A 15% tolerance band that still blocks outside it.** The option this ADR came closest to adopting,
and the one recommended before the decision. It preserves §4's "refused" wording while only refusing
genuinely wrong screens. Rejected because it leaves the publish path with a hard failure whose
threshold is a constant chosen from a four-device sample — the same "enforcing a guess while
presenting it as a check" that ADR 0054 rejected for `capability_override`. A warning carrying the
same number makes the same claim without the outage when the number is wrong.

**Block on orientation only, warn on aspect.** Mirrors the shipped Channel ↔ Device rule, and keeps
one server-side enforcement point. Rejected because it splits the geometry rule across two
enforcement models for one screen, and because the orientation half suffers from the same evidence
problem: Screen 04's `orientation` column and its heartbeat dimensions disagree, so the field the
block would fire on is one this ADR has just decided not to trust in isolation.

**Trust `screen_ratio` / `screen_dimension` from the heartbeat.** They are the fresher values,
rewritten every sixty seconds. Rejected: the player contract deprecates both, `media_screens_list`
already ignores both, and `screen_ratio` has two writers, so its value depends on which call ran
last rather than on what the Device is.

**Require the profile and heartbeat values to agree, treating disagreement as unknown.** The
conservative reading. Rejected on arithmetic: two of four profiled production Devices disagree
today, so this reclassifies half the profiled fleet as unprofiled and makes the warning fire on
Devices that have in fact reported.

**Ship no geometry check at all until ticket 17.** The minimal option, and defensible — nothing
enforces, so why compute. Rejected because the warning is what surfaces a misconfigured screen to
the person who can fix it, at the moment they are choosing it, and because ticket 17's readiness
review needs the outcome distribution across the already-profiled fleet before anyone can judge
whether the 15% band is safe to enforce. Note what this reason is **not**: the advisory phase does
not make unprofiled Devices report. That takes ticket 18.

## Consequences

- Ticket 16 shrinks to frontend only: a pure fit module with its check file and the wizard warnings.
  No migration, no `media_publication_activate` change, no `publish-eligibility` change, no new
  refusal anywhere, and no R0.
- Ticket 10 (`zones[]` payload) loses its stated precondition that "a Device whose geometry is known
  not to fit is refused". Nothing is refused; ticket 10 proceeds on ticket 16's advisory landing.
- Ticket 17 expands from "unknown geometry fails" to "geometry enforcement turns on", covering both
  halves behind one readiness threshold, and remains without a number until grooming. It gains
  ticket 18 as a prerequisite.
- Ticket 18 is created: the player reads `profile_required` and re-sends `device-profile`, and
  `media_heartbeat` is widened to set the flag on missing geometry. Cross-repo, and on nobody's
  critical path — 16 and 10 both proceed without it.
- ADR 0044 §4's staged exception is superseded whole rather than amended again: it distinguished a
  half in force from a half deferred, and after this decision neither half is in force.
- **Nothing in this decision changes production.** Ticket 16 is frontend only; there is no
  migration, no R0, and no behaviour visible to a player. Geometry coverage sits at 4 of 12 and can
  only drift — a monitor change, a settings edit, or re-entering the player shell will move it, and
  nothing the server does can. Ticket 17's readiness number therefore cannot be *driven* to a target
  until ticket 18 lands. That is a real cost of this decision and it is accepted knowingly: the
  alternative was shipping a flag to production that no build fetches, and calling it a recovery
  path.
