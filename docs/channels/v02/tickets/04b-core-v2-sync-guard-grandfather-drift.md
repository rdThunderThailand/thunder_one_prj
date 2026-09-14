# 04b: Core v2 — synchronized-Group guard, grandfathering, Group drift

**Repo:** Thunder_Core
**Blocked by:** 04a
**Status:** ready-for-agent — GitHub [#102](https://github.com/rdThunderThailand/thunder_one_prj/issues/102)
**Recommended model / effort:** **frontier reasoning tier, high effort** — Claude Opus (thinking on) · GPT-5 / o-series at `reasoning: high` · Gemini 2.5 Pro with thinking. Why: guard semantics (set-based, first-activation-only grandfathering) are the most judgment-heavy rules in the ADR and were reworked twice in review

## What to build

Activation refuses an incomplete synchronized Group and a direct `device` target inside one — **only on a Publication's first activation** (no snapshot yet). A Publication that has aired republishes with the same targets and gets a warning on the Group instead; that warning also populates the Channel-level `direct_target_conflicts` until M2. `media_publication_get` reports Group membership drift.

## Closing conditions

- [ ] Guard runs after all intents are resolved to a Channel set; for every synchronized Group touched all members must be present, else refuse naming the Group and the missing members; a `device` target whose Channel is in a synchronized Group is refused by the separate rule
- [ ] Both refusals skipped when `publication_snapshots` has a row for the Publication → activation proceeds and `media_publication_get` returns `group_warnings[]` for that Group; `direct_target_conflicts` on the affected Channels populated from the same data
- [ ] `drift_check.groups[{group_id, name, added[], removed[]}]` comparing current membership with the snapshot's provenance rows
- [ ] HTTP verification on develop: Group `S` (sync, C1+C2), Group `A` (indep, C1). New Publication targeting `A` → 400 naming `S` and `C2`. A Publication that already aired with a `device` target now inside `S` → Republish 200 + warning. Add C3 to `S` → `drift_check.groups` shows `+C3`; Republish → provenance has C3, drift clears
- [ ] tsc on changed files; `DROP FUNCTION IF EXISTS`; REVOKE/GRANT; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §5 (guard + grandfathering definition), §6 (drift)
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2 items 7 (guard part), 8 (drift)
- Live data that motivates grandfathering: develop has dozens of legacy `device`-type targets pointing at devices that become members of the split synchronized Group (SESSIONLOG 2026-09-12)
- Code: same activate/get migrations as 04a; `direct_target_conflicts` producer in `20260824130000_synchronized_playback_epoch_phase.sql`
- Mockup: D11 modal A (target = Group)
