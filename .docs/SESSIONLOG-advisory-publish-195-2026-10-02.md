# Draft publish conflict checks — #195

## Scope

- Base: `origin/dev` at `c9c9c9e387e9ed1ddf829f7c6ccc3ec398a59581`.
- Reuse the existing first-publish and publish-changes dialog; no Core API, schema or migration change.
- Channel/Group membership is freshly resolved on every dialog open. A failed lookup remains a failed advisory check. Direct-device targets bypass Channel lookup.
- Keep Publish enabled during checks and after check failure, disabled during publishing. Use current form values and exclude the current publication.
- Preserve dialog response cancellation, form edits and partial-save semantics.
- Approved plan: `docs/program/plan-195-204-draft-publish-preview.md`.

## Executed verification

- `node src/features/media-workspace/publications/program-edit.check.mts`: PASS, including fresh membership, lookup failure, direct-device bypass and current priority/publication/schedule payload.
- Mutation check: swallowing membership lookup failure as `[]` made the check fail with `Missing expected rejection`; restoring propagation returned GREEN.
- Targeted ESLint, `pnpm exec tsc --noEmit`, `pnpm exec next build`, `git diff --check`: PASS.
- Browser tool selected by owner. Localhost server on port 3000 reached the sign-in page; no authenticated Program acceptance yet.

## Remaining verification and boundaries

- Browser overlap/no-overlap, slow/failed HTTP lookup, Cancel, reopen, published Program and real activation scenarios remain unverified.
- No shared fixture, activation, cleanup, production write, deployment, tag, Ready transition or merge performed.
- Shared develop fixture/activation requires exact-ID approval. Physical Player playback remains pending an online device.
- Keep delivery as Draft and do not close #195 until acceptance evidence is complete.
