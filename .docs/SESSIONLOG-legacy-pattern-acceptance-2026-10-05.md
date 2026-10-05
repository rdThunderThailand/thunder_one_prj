# Legacy Program pattern acceptance — 2026-10-05

## Authorization and environment

Owner reported #213 merged; GitHub confirmed merge 2c7fcf72fda703fb567b5e81166eeb1bca954667 at 2026-10-05T13:47:32Z. Owner approved the next develop fixture scope and deferred physical Player verification.

Scope: /private/tmp/acceptance-legacy-patterns-2026-10-05.md. Develop ftfmokgphewzyxzwjitv, tenant 22222222-2222-2222-2222-222222222222. localhost:3000 proxy config returned 200, Core localhost:3001; Core process cwd and environment project ref matched develop. No production writes, migrations, app code or dependencies changed.

Guarded transaction created exactly fourteen authored rows: one Playlist/three items, one operator-facing Layout (Composition)/three bindings, two draft Publications/two targets/two schedules. Geometry was referenced without mutation; three ready/approved Assets were reused, source's fourth draft-approval Asset excluded. Fixture item durations were 3s; preview loop was 12s including fade transitions. IDs are listed in the exact scope document; executable guarded SQL: /private/tmp/thunder-acceptance-195-204/legacy-fixture.sql.

Temporary headed Playwright outside repo used a strict business-write allowlist for the four fixture parent IDs only, bounded to sixteen pattern updates/six draft updates per Publication/one successful activation each. Authentication remained in browser memory; no headers, tokens or storage state exported. Browser reached the existing localhost development operator session (Super Administrator), not the production operator session. Browser and process closed successfully afterward.

## Browser + actual HTTP acceptance

| Case | Result |
|---|---|
| Layout count=0 Apply | Fresh affected-programs GET 200/count 0; PUT zones 200 without confirmation; only Main changed to shuffle |
| Playlist count=0 Apply | Fresh GET 200/count 0; PATCH 200 without confirmation; preview order changed |
| Layout/Playlist count lookup aborted | UI displayed the subject-specific count failure; no mutation issued |
| Layout/Playlist lookup delayed 2.5s | Saving button disabled while lookup pending |
| Layout/Playlist write aborted | UI displayed save failure, preserved choice, no false success; successful-write counter unchanged |
| Actual Layout revision conflict | Held original PUT at revision 2; independent same-values zones PUT 200 advanced revision to 3; released stale PUT returned real HTTP 409 |
| Revision conflict UI/recovery | Correct Layout-changed-elsewhere message; choices cleared and detail reloaded; choosing Header again and Apply succeeded at latest revision |
| Playlist fresh count, mounted at 0 | Activated Layout fixture once; Apply recounted to 1, showed confirmation; Cancel issued no PATCH |
| Playlist fresh count after second activation | Same mounted field recounted to 2 despite initial count 0; confirmation Apply issued one PATCH 200 |
| Layout nonzero confirmation | GET count 1; Cancel issued no PUT; subsequent confirmation Apply issued one PUT 200 |

Interception is explicitly network-failure evidence, not a fabricated server 500. Revision conflict was a real backend 409, not an intercepted response. Some first locator attempts timed out due to accessible names including helper text, the Thai cancellation label, or initial local navigation loading; corrected selectors reached the actual controls. Timeouts were not passes.

## Actual preview item selection after Apply

Signed preview URL paths were matched to the three approved Asset IDs in browser memory only. Output contained Asset IDs, Zone name and media kind, never URLs/tokens. Paused preview was moved using the real keyboard timeline to 1.5s, 5.5s and 9.5s, away from fade windows.

- Playlist sequential: 5e7c0660… (video), cf935b88… (image), 929db755… (video).
- Playlist shuffle after Apply: cf935b88…, 5e7c0660…, 929db755…. Observed actual mounted media elements, not just a selected radio or model result.
- Layout Header before changing: 5e7c0660…, cf935b88…, 929db755…; after Header Apply shuffle: 929db755…, cf935b88…, 5e7c0660…. Main/Side remained unchanged.
- Main's shuffle permutation for its Zone seed is the identity with these three items. This was checked against the existing zoneSchedule implementation before choosing Header, whose shuffle visibly reverses the outer items. No bug inferred from a valid identity permutation.

This proves preview selection/order after Apply. Some video elements were at readyState 0/1 immediately after seeking; it is not full video decode/playback or physical Player proof. Header/Playlist image and mounted media selection were inspected in the actual browser.

## Bounded activation and completion

Target d995d6e8-d16e-4ad3-8736-3a95f1037250 had last_heartbeat_at NULL before insertion, immediately before each activation and after completion. Both targets were direct-device only. Schedules were finite, +24 through +48h from fixture creation.

| Publication | Job | Snapshot | Job Target |
|---|---|---|---|
| Layout 930ff823-9e20-4146-b422-0d19e2de42ca | 90c2d3d7-76f8-4083-bc54-46a63265125e | 50799822-4dd9-4ed4-b1df-75b0cebe8669 | f4c96e96-158f-4639-9ab0-08c6a87fb782 |
| Playlist 5e5ff4ea-ed62-49df-8a9b-6a9df927330a | 1bda2e6e-d9cd-40c8-a8a3-48b751fdd39d | 3986e929-1a5a-461e-8d2a-3e65e5033143 | fc308f3d-36c7-4b49-88f0-aa81dbc5a62a |

Both activation POSTs returned HTTP 200. Exactly two Jobs/two snapshots exist. Seven successful pattern writes total: four Composition zones writes (including the concurrent same-values update), three Playlist metadata writes. No draft PATCH/Next/Save, bulk publish-changes or third activation. Fixture Composition final revision 5; Playlist revision 4.

Both cancel POSTs returned HTTP 200; DB confirms both Publications cancelled, revision 1. Activation/cancellation did not increment this draft revision; no assumed revision accounting. Job Targets remained pending, not Playback Confirmed. Historical fixture rows were retained; no delete/trash.

Snapshot/header/zone/item hashes matched before the final Layout Apply and after both cancels. This establishes snapshot stability for that interval, not a claim that baseline hashes were captured before every earlier pattern write.

Original-row fingerprints unchanged after completion:

| Source | MD5 |
|---|---|
| Geometry 411dccae-54e3-4cd7-9f92-eeb21934d674 | b300b8681ab522109e96199d6dde0f98 |
| Composition Test Layout 1 8a51df15-09e8-4608-926f-59f4ab85c205 | ac86e633e5e3dbbdd42a1cd249eaceca |
| Source Playlist 3334949b-da44-4208-b73f-9e00133699df | deac070e7890ea0064fd5a4fecd4fead |
| Its original items, ordered by position/ID | cb5088fb14fb601d0d3f8fc04a9e0e3b |

## Existing model checks

All exited 0: playback-pattern-apply.check.mts, next-transition.check.mts, program-edit.check.mts, schedule-preset.check.mts. Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings only; no package change to silence them. Documentation-only repository change: git diff --check; no repeat build/lint/TypeScript claim.

Screenshots: /private/tmp/legacy-layout-real-409.png (visually inspected), /private/tmp/legacy-playlist-fresh-count-two.png, /private/tmp/legacy-layout-confirm-one.png. Temporary screenshots/scripts are not repository dependencies.

## Heartbeat question and remaining boundaries

Read canonical Core heartbeat route and current MAIN media_heartbeat/resolve_device definitions. A valid synthetic POST with empty payload changes assets.last_heartbeat_at and connection_status to online. It does not send download reports, playing ACKs, or prove physical rendering. Current resolve_device only authenticates the token; the existing asset status-history trigger logs legacy/lifecycle status changes, not connection_status. Downstream health/monitoring can nevertheless observe the simulated freshness.

Owner deferred physical Player verification; no synthetic heartbeat, profile, download report, playing ACK or playback log was submitted on either environment. Physical playback remains unverified until a real Media Device connects and reports delivery/playback.

The named count/failure/revision/preview-order gaps from #202/#203 are now covered. The broader base-handoff Edit-page edge cases and Figma deltas were not included in this fixture test; no claim they passed. #97 and optional cleanup remain untouched. Owner controls Ready/merge of the record PR.

Remaining Edit acceptance from .docs/HANDOFF-program-after-v0.5.2-2026-10-01.md: switch Layout, multiple Location facets in Change Target, remove Group from a live Program and inspect the stop-playing message, real Publishing/Scheduled badges, and dirty-form Discard. These need a separately bounded fixture scope; the present two-activation budget is exhausted and both Programs are cancelled.

Remaining Figma decisions/comparisons: split Publish action, subtitle source, two-month Date Range calendar, frame 07/12 image comparison, and Channel pictures without a source field. Program 12 source image now exists in the repository; existence alone is not comparison evidence. No design fork implemented in this acceptance run.
