# Release v0.7.0 preparation — 2026-10-05

## Authorized scope

- Owner authorized proceeding after #216 merged into `dev`.
- Prepare a Draft version-bump PR into `dev`; owner controls Ready/merge. The production promotion PR follows only after this preparation merges.
- Follow `docs/agents/versioning.md`. Its whole-diff MINOR/PATCH classification takes precedence over the older summary in the workflow skill.

## Verified baseline

- `origin/dev`: `ca739f17f511d41d9c090a6f80dec893a7228761` (#216 merge).
- `origin/main`: `b238c115e54657fe84ed1fe0b98c37840e3dd9fa`, package version `0.6.1`.
- Since main: 12 commits / 5 first-parent merged PRs (#212–#216).
- #216 adds Edit context and a two-month Date range selector; #215 includes the removed-target warning fix. #212–#214 record release and acceptance evidence.
- Therefore the next version is `0.7.0`, a backward-compatible feature release. Next promotion count is #10; no completed-release row is recorded before promotion.

## Executed release checks

Ran on the exact `dev` baseline before branching/bumping:

- `pnpm install --frozen-lockfile` — exit 0, already up to date, no lockfile changes.
- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm exec next build` — exit 0, generated 107 pages; network permission used for existing Google Fonts. No deployment.

## Change

- Branch `release/v0.7.0`.
- Only `package.json` version `0.6.1` → `0.7.0`, plus this release-only SESSIONLOG.
- No application logic, dependencies, lockfile, migrations, schema, API, or shared data changed.

## Verification limits and next action

- This metadata-only preparation does not add new browser acceptance. Existing authenticated Edit browser evidence and screenshots are in #215/#216; they are not new production proof.
- Create wizard/Custom days browser regression, full screen-reader/touch coverage, production acceptance of the new release, Publishing on an online Player, and physical Player playback are not claimed by this preparation.
- After owner merges the preparation: refresh `dev/main`, then open a Draft `dev → main` release PR with one entry per included PR and the warning `merge = deploy to production immediately`.
- Owner controls Ready/merge. After production promotion, tag creation/push requires approval of the exact command; do not create or push a tag here.
