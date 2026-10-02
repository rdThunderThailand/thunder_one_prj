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
- Final repeat after browser fixture removal: program-edit check, targeted ESLint and diff check exit 0; production build exit 0 (compiled 17.1s, TypeScript 14.1s, 107 pages). Temporary verification routes were absent from the final build.
- Browser tool and Thai PR selected by owner. Initial sign-in obstacle was resolved; authenticated Chrome acceptance below was subsequently performed.

## Browser acceptance

Environment: localhost:3000 frontend, localhost:3001 Core, shared develop Supabase `ftfmokgphewzyxzwjitv`. No production or physical Player verification.

- Existing Draft `4152229e-7dc6-4ab6-bdc0-078fab7392b2` (revision 14) opened through its non-autosaving edit page, not the wizard. First-publish copy was shown. Publish was enabled while `Checking schedule conflicts…`; original Channel 1 returned no warning.
- Cancel preserved a locally edited Program Name. Reopening began a fresh check. Adding Channel 2 only to unsaved form state produced real overlap warnings for zz-138-layout-a/b and zz-fe-d-live copies. Publish remained enabled for normal, low, high and urgent; suppression/takeover copy changed with current form priority.
- Group target `Channel for Screen 3-4` (two member channels), applied only locally, completed its check without warnings. Direct-device bypass and membership failure were verified in the existing model check, not browser HTTP.
- Existing active Program `f641d235-1bb4-4d80-b8f4-5a5d626befd3` (revision 4) retained Publish changes copy, content-drift note and conflict warnings; its own publication was excluded. No confirmation/write was performed. Both edit pages were exited through Discard of local form state.
- Develop DB before/after these UI checks: Draft status/revision/updated_at/priority remained `draft / 14 / 2026-10-01 08:33:01.553278+00 / normal`; active Program remained `active / 4 / 2026-10-01 08:01:02.55188+00 / normal`. These comparisons are DB evidence, separate from rendered UI evidence.
- A temporary local-only surface exercised the actual PublishChangesDialog with callback fixtures: failure displayed `Could not check schedule conflicts. You can still publish.` and enabled Publish; a simulated confirm disabled Publish/Cancel while busy; after simulated activation error the dialog remained open with error and no success. Simulated confirm count stayed 1. Reopening with an empty result cleared old failure/error. React development StrictMode invoked lookup setup twice per open; this counter was not interpreted as duplicate publishing.
- Fixture callbacks never called backend APIs. The surface was moved to `/private/tmp/publish-dialog-check-195.tsx`, outside app routes and the delivery commit. This proves dialog presentation/state, not actual HTTP failure or save/activation integration.

## Remaining verification and boundaries

- Real browser Network throttling/offline/request blocking was unavailable through the connected browser APIs; slow/failed metadata/conflict HTTP and real activation/partial-save failure remain unverified. No interception runner was added. No network emulation setting was successfully changed.
- No shared fixture or activation was created for #195; no production write, deployment, tag, Ready transition or merge performed. A separate #204 wizard autosave incident was reported and cleaned with exact-ID owner approval; its evidence is in that branch's SESSIONLOG.
- Shared develop fixture/activation requires exact-ID approval. Physical Player playback remains pending an online device.
- Keep delivery as Draft and do not close #195 until acceptance evidence is complete.
