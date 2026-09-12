# Channel v02 tickets

One file per ticket. Each carries **closing conditions** (what must be true, at which layer it was
verified, and which steps are R0) and **artifacts** (the ADR sections, plan sections, mockups and
code the ticket depends on) so it can be worked from a fresh context.

**Overview:** `../README.md` · **Rules:** `docs/adr/0074-channel-one-player-and-channel-group.md` ·
**Order/binding:** `../plan-channel-v02.md` · **Mockups:** `../design/`

Published 2026-09-12 as GitHub issues #98–#111 (labels `ready-for-agent`, `channel-v02`, plus
`repo:core` for Thunder_Core work); Live View parked as #97. Work the frontier: any issue whose
"Blocked by" issues are closed.

Rules that apply to every ticket: verify at the layer the operator uses and ask the 3-option
question before any browser test (CLAUDE.md §3) · every migration apply is R0 · no commit/push
unless told · SESSIONLOG per session · Design binding in plan §0 wins on layout and wording.

## Board

| # | Issue | Ticket | Repo | Blocked by | Model tier | Status |
|---|---|---|---|---|---|---|
| 01 | [#98](https://github.com/rdThunderThailand/thunder_one_prj/issues/98) | [M1a — additive schema only](01-m1a-additive-schema.md) | Thunder_Core | — | mid / medium | ready-for-agent |
| 02 | [#99](https://github.com/rdThunderThailand/thunder_one_prj/issues/99) | [Core v2 — Channel read/write with Player, Output Kind, Display Configuration](02-core-v2-channel-read-write.md) | Thunder_Core | 01 | **frontier / high** | ready-for-agent |
| 03 | [#100](https://github.com/rdThunderThailand/thunder_one_prj/issues/100) | [Core v2 — Channel Group RPCs and routes](03-core-v2-channel-groups.md) | Thunder_Core | 01 | mid / medium | ready-for-agent |
| 04a | [#101](https://github.com/rdThunderThailand/thunder_one_prj/issues/101) | [Core v2 — Group intent, expansion, provenance, via_groups, transitional sync read](04a-core-v2-group-intent-expansion-provenance.md) | Thunder_Core | 01, 03 | **frontier / high** | ready-for-agent |
| 04b | [#102](https://github.com/rdThunderThailand/thunder_one_prj/issues/102) | [Core v2 — sync guard, grandfathering, Group drift](04b-core-v2-sync-guard-grandfather-drift.md) | Thunder_Core | 04a | **frontier / high** | ready-for-agent |
| 05 | [#103](https://github.com/rdThunderThailand/thunder_one_prj/issues/103) | [FE compat slice — Group intent round-trips](05-fe-compat-group-intent.md) | thunder_one_prj | 02, 04a deployed | mid / medium | ready-for-agent |
| 06 | [#104](https://github.com/rdThunderThailand/thunder_one_prj/issues/104) | [M1b — query-driven data rewrite](06-m1b-data-rewrite.md) | Thunder_Core | 02, 03, 04a, 04b, 05 deployed | **frontier / high** | ready-for-agent |
| 07 | [#105](https://github.com/rdThunderThailand/thunder_one_prj/issues/105) | [FE — All Channels list, Status = Player health, detail panel](07-fe-channels-list-and-detail.md) | thunder_one_prj | 02 deployed | mid / medium | ready-for-agent |
| 08 | [#106](https://github.com/rdThunderThailand/thunder_one_prj/issues/106) | [FE — Create Channel wizard](08-fe-create-channel-wizard.md) | thunder_one_prj | 07 | mid / medium | ready-for-agent |
| 09 | [#107](https://github.com/rdThunderThailand/thunder_one_prj/issues/107) | [FE — Edit Channel page + canvas-first geometry](09-fe-edit-channel-and-geometry-source.md) | thunder_one_prj | 08 | mid / medium | ready-for-agent |
| 10 | [#108](https://github.com/rdThunderThailand/thunder_one_prj/issues/108) | [FE — Channel Groups pages](10-fe-channel-groups-pages.md) | thunder_one_prj | 03, 07 | mid / medium | ready-for-agent |
| 11 | [#109](https://github.com/rdThunderThailand/thunder_one_prj/issues/109) | [FE — Manage Groups from a Channel (D9)](11-fe-manage-groups-from-channel.md) | thunder_one_prj | 10 | mid / low | ready-for-agent |
| 12 | [#110](https://github.com/rdThunderThailand/thunder_one_prj/issues/110) | [FE — Publication targets Channel Groups; via-group and drift](12-fe-publication-group-targeting.md) | thunder_one_prj | 05, 10 | mid / medium | ready-for-agent |
| 13 | [#111](https://github.com/rdThunderThailand/thunder_one_prj/issues/111) | [M2 — cleanup migration and contract contraction](13-m2-cleanup.md) | both | 06, 09, 11, 12 deployed | **frontier / high** | ready-for-agent |
| 14 | [#97](https://github.com/rdThunderThailand/thunder_one_prj/issues/97) | [Live View — parked, needs its own design session](14-live-view-parked.md) | both | 07 + new grill | frontier / high (design) | **parked** — not in this publish |

## Model tier legend (model-agnostic — pick the equivalent in whatever harness runs the ticket)

| Tier | Claude | OpenAI | Google | Use for |
|---|---|---|---|---|
| **frontier / high** | Opus, thinking on | GPT-5 / o-series, `reasoning: high` | Gemini 2.5 Pro, thinking | live-DB writes, RPCs that decide playback, guard semantics, anything reworked in review |
| mid / medium | Sonnet | GPT-5 `reasoning: medium`, GPT-4.1 | Gemini 2.5 Flash-thinking | transcription of a fixed spec, UI against a fixed mockup, small mappings with a check |
| mid / low | Sonnet | GPT-4.1, GPT-5 `reasoning: low` | Gemini 2.5 Flash | one-modal tickets |

Rule for every tier: a design fork (a choice the ticket does not settle and that is hard to reverse)
means **stop and ask the owner**, never decide inside the ticket. Each ticket file repeats its own
tier with the reason.

## Order

Start: 01. After 01: 02 and 03 in parallel. 04a after 03; 04b after 04a. 05 after 02 + 04a are
deployed to develop. 06 only after 02 / 03 / 04a / 04b / 05 are deployed and verified — it is the
real R0 because develop is the live database. 07 starts once 02 is deployed (does not wait for 06:
transitional `player`). 10 after 03 + 07. 12 after 05 + 10. 13 last.

## Publishing

Done — see the Issue column. Keep the local file and the issue in step: the issue is what an agent grabs, the file is what the repo keeps.
