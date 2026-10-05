# #195 real HTTP acceptance — 2026-10-05

## Scope and authorization

- Implementation `5e9de51`, prior evidence `4e1cf89`, Draft PR #209. Local authenticated Chrome → frontend localhost:3000 → Core localhost:3001 → develop `ftfmokgphewzyxzwjitv`.
- Owner approved exact fixture IDs and temporary Playwright outside the repository. No new repo dependency, runner, CI, migration or API change.
- Tenant `22222222-2222-2222-2222-222222222222`; M2 Smoke Channel `1f3f43f0-1e7a-4aaf-b99b-ce4d7d888b12`; Player `d995d6e8-d16e-4ad3-8736-3a95f1037250` offline with no heartbeat. Historical thunder_demo was absent on develop; production was not used.
- A `b4bfb441-8d1c-42b9-9c27-2861593fa18d`: direct-device, initially composition without content. B `2780cd6c-4767-488f-ba4a-23c31ccca068`: Channel target, existing Test Layout 1 composition `8a51df15-09e8-4608-926f-59f4ab85c205`.
- Two schedules, IDs `44f0f1e2-cc4e-477b-9d46-729ba0c0b9ff` and `479a2b5f-eda9-494d-9ec2-1ad9e5a5d54c`, both 2026-10-06 08:05:54.617782+00 through 2026-10-07 08:05:54.617782+00. Normal priority, no recurrence.
- Guarded SQL transaction checked exact target membership, offline state, no existing active target publications, composition revision/timestamp and ID collisions. First attempt omitted required campaign_id and rolled back completely (fixture count 0). Corrected insert referenced the existing Unassigned campaign `a0dd904d-7c0f-45c2-b3a6-7cdaa886d04e`; no campaign/brand created.

## Authenticated browser and HTTP

- Direct-device A: delayed conflicts request 10 seconds. Dialog showed Checking while Publish remained enabled. Cancel closed without PATCH/activate. A failed network request then showed “Could not check schedule conflicts. You can still publish.” with Publish enabled.
- Reopening after cancellation checked again; late response from the closed dialog did not replace the reopened failure state. Fault settings were restored after the scenario.
- Direct-device dialog checks did not perform a fresh Channel membership request; page initialization still fetched Channels for existing UI display.
- Real A save/activate failure: PATCH /media/publications 200, POST /A/activate 400 (“publication has no layout”). UI showed the error, remained on Draft edit and did not show success. DB: saved description, revision 2, zero jobs/snapshots.
- The first picker selection was confirmed before its asynchronous content load completed; two further activation attempts still had no composition and returned 400, with zero jobs/snapshots. After waiting until Test Layout 1 appeared in Content Source, PATCH and A activation each returned 200. This was a test timing correction, not a product change.
- Channel B: blocked fresh GET /media/channels after initial page load. Opening Publish showed check failure, not no-overlap, and Publish remained enabled. Cancel then restore/reopen fetched fresh Channels and conflicts returned 200.
- B showed an actual equal-priority overlap warning naming A. Confirm issued one PATCH and one activation, both 200. Overlap remained advisory.
- Published B: changed description locally, opened existing Publish changes dialog, saw A overlap, confirmed once. POST /B/update-published 200, description persisted, revision 4. No extra activate request.
- Browser route guard allowed only read-only conflicts/preview-urls and approved two-fixture publication mutations; unrelated business writes were blocked. No auth headers, cookies, password, token or storageState were exported.
- Screenshots: `/private/tmp/195-direct-conflicts-network-failure.png`, `/private/tmp/195-channel-lookup-failure.png`, `/private/tmp/195-real-activation-failure.png`, `/private/tmp/195-real-overlap-warning.png`.

## Cleanup and postconditions

- Before activation/update, rechecked Player offline/no heartbeat.
- A created one successful job/snapshot; B activation and published update created two. Total exactly 3 jobs/3 snapshots, each targeting only the approved Player; delivery remained pending/offline, not playback proof.
- Cancelled B and A through authenticated UI confirmation: POST /B/cancel 200 and POST /A/cancel 200. Final DB status both cancelled; A revision 5, B revision 4. History retained as approved; no deletion performed.
- Shared composition remained revision 4, updated_at 2026-10-01 10:43:31.349467+00. Its three source Playlists retained historical timestamps/revisions. No shared Layout/Playlist write occurred.
- Closed temporary Playwright browser and restored interception state. Original local frontend/Core servers remained running.

## Verification limits

- Network faults above are actual browser request interception failures/delay; aborted requests have no Core HTTP response. Normal conflicts, activation errors/success and published update used real Core HTTP and persisted develop DB state.
- Group/current edits/priority variants and existing checks, targeted ESLint, TypeScript and production build are documented in the executed October 2 evidence; no claim of rerunning the build for this documentation-only session.
- Single confirmations produced the expected single successful mutation; rapid concurrent double-click was covered only by the prior busy/model fixture, not replayed against shared develop.
- Deployed production and physical Player playback remain unverified. PR stays Draft; owner controls Ready/merge. No issue was closed.
