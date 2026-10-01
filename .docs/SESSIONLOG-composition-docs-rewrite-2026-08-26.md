# Session log — Composition re-model, documentation phase (2026-08-26)

**Branch:** `feat/layout` · **Repos touched:** `thunder_one_prj` only (docs + CONTEXT.md; no source
files, no migrations, no production reads or writes this session)

## What this session was

Phase A of the plan agreed at the start: rewrite the spec and the ticket series against ADRs 0049 /
0050 / 0051 before any code is written. The prior round of implementation was invalidated by the
re-model, and the documents an executor would read still described the superseded model — which is
exactly how that round went wrong.

No design decisions were reopened. Everything here follows the three accepted ADRs.

## Judgment calls made while writing (not in the ADRs)

- **Composition routes** at `media-workspace/compositions`, feature code at
  `features/media-workspace/compositions`, mirroring `playlists` / `layouts`. The empty
  `communication/layouts` directories are leftovers from the route migration, not a pattern to copy.
- **ADR 0050's precision work folded into ticket 01**, not a separate track: it alters the same two
  tables and the same RPC as the `role` drop and the Zone-id diff, and precision that changes at three
  of its four points changes nothing.
- **ADR 0050's editor tools split out to ticket 11** — same ADR, different repo layer, no dependency
  from the Composition track.
- **Preview (ADR 0051) is ticket 12**, blocked only by the Composition editor for one of its three
  mount points; the Playlist mount point can ship first.
- **Player span (ADR 0050 §5) is ticket 13, marked not-for-agent** — other repo, needs its own
  instruction. Written down so the decision is not lost.

## Files

**New:** `docs/layouts/plan-composition.md` · tickets `01-zone-identity-and-precision`,
`02-composition-schema-and-rpcs`, `03-composition-list-and-editor`,
`04-publication-type-composition`, `05-activation-materializes-zones`, `06-drift-indicator`,
`11-layout-editor-wide-screen-tools`, `12-pre-publish-preview`, `13-player-span-all-displays`

**Renamed:** `spec-per-zone-content.md` → `spec-composition-content.md` (rewritten in full) · tickets
04→07, 05→08, 06→09, 07→10 (renumbered and reworded Layout → Composition, dependencies rewired)

**Edited:** `CONTEXT.md` (new **Composition** entry; Layout loses "never content" and gains three
decimals / stable Zone ids / `reference_resolution`; Zone loses `role`; Publication mentions
Composition) · `contract-v2-zones.md` (`role` dropped from `zones[]`, precision to three decimals,
A6 audit correction, multi-monitor wording) · ADR 0044 header (§1 and §13 marked superseded) ·
ADR 0048 header (superseded in full, do-not-build warning) · `plan-layout-execution.md` and
`plan-layout-ui.md` (staleness headers)

**Deleted** (approved, R0 — superseded and uncommitted, kept only in the index):
`01-zone-bindings-persist.md`, `02-wizard-step2-layout-mode.md`, `03-activation-materializes-zones.md`.
Leaving them would have given an executor two conflicting versions of tickets 01–03.

**Handoff for the next session:** `/private/tmp/HANDOFF-composition-execute-2026-08-26.md`

## Verification

Documentation only. Nothing was compiled, run, or applied — there is nothing in this session to
verify at a user-facing layer. The factual claims about production (three migrations never applied,
one Layout with two Zones, 99 snapshot rows all `role = 'main'`, 504 devices without a screen size)
are carried over from the prior session's read-only audit and were **not** re-checked here.

Code-level claims in the tickets were spot-checked against source: `geometry.ts`'s `toTenths`,
`rectsOverlap`, the hardcoded `1000` bound in `validateZones`, and `parseAspectRatio`'s
`/^(\d{1,2}):(\d{1,2})$/` all read as the ADRs describe them.

## Next

Ticket 01, then 02. Execution is Sonnet work — the design forks are closed — except that every
migration apply to production is R0 and comes back for approval.
