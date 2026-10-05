# Frontend v0.6.1 release preparation — 2026-10-05

## Scope

- Owner merged #208 and #209 into dev. Latest dev head: `33b4146996e89594ca89e1577788acd980ee8688`.
- Reviewed the complete main-to-dev diff: backward-compatible fixes #195/#204 plus implementation, verification and release documentation. No feature, API, schema, migration or dependency change. PATCH 0.6.0 → 0.6.1 follows `docs/agents/versioning.md`.
- Created `release/v0.6.1` from current origin/dev. Changed package.json version only; SESSIONLOG is release-only documentation.
- Release sequence requires owner-merged release-prep PR into dev before a separate Draft dev-to-main promotion PR. The next promotion count is #9. Merge into main deploys production immediately.

## Current verification

- On merged dev source, `pnpm install --frozen-lockfile`: exit 0, lockfile unchanged.
- `pnpm exec tsc --noEmit`: exit 0.
- `pnpm exec next build`: exit 0, compiled in 7.0s, TypeScript 10.9s, 107 generated pages. Only package version metadata changed after starting this build; no implementation change.
- `git diff --check`: exit 0.
- GitHub deployment `6854768491` corresponds to exact dev head `33b4146`, state success.
- Deployed URL: https://thunder-jcvk0kq06-thunders-projects-3dff0238.vercel.app. GET /login returned 302 to Vercel SSO protection. This verifies routing/protection only, not app login, authenticated Core HTTP or browser acceptance.

## Pending

- Owner choice for deployed-develop browser verification and release PR language was requested per CLAUDE.md sections 3/4. No browser verification has been claimed for this deployment.
- Release-prep PR submission, owner review/merge, promotion PR, production verification and physical Player playback remain separate steps.
- No main merge, production write/deploy, tag creation or tag push performed. Exact tag command requires owner approval after the promotion merge.
