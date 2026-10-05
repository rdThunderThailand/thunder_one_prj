# Removed-target warning browser verification — 2026-10-05

Owner explicitly selected doing the browser verification for the new warning in Draft PR #215. Existing Thai PR language remains approved. No additional app code changed.

Temporary headed Playwright used a separate authenticated Chrome context at localhost:3000, with service workers blocked and all business mutations blocked. Only reads, authentication and existing conflict/preview read POSTs were allowed. No fixture creation, activation, heartbeat or production write. Browser closed and runner exited 0; no credentials or storage state exported.

Read-only develop query selected existing Live Program zz-138-layout-b, publication f641d235-1bb4-4d80-b8f4-5a5d626befd3. Its stored target was Channel for Screen 2 (257b33d9-9936-4791-9dc9-0d017f6ae605). Existing Group Programs were outside their finite airing windows, so they were not treated as current Live cases or reactivated.

## Actual UI checks

- Opened the real Edit page, Change Target, removed Channel for Screen 2 in form, selected Channel for Screen 1, and Apply. Opened Publish changes without confirming Publish.
- Actual dialog text assertion passed: `Will remove 1 target: Channel for Screen 2`; old `Will stop playing on` text absent. Screenshot /private/tmp/program-warning-new-copy.png was visually inspected. Captured during dialog animation; it is text evidence, not a settled animation/layout check.
- Cancelled dialog, restored original Channel for Screen 2 while keeping the additional Channel for Screen 1 in form, Apply, reopened Publish changes. Assertion passed: no removal warning for an addition-only change.
- Cancelled and used Go Back -> Discard. No Publish, Save or activation was confirmed.
- Browser request audit: zero business-mutation attempts; four permitted read POST requests. No writes were merely blocked and then counted as successful cancellation.

The final reopened-avatar assertion failed because the temporary script read aria-label, while the existing ChannelAvatars component names its list items using title. Source inspection confirmed that selector mismatch. Do not report that assertion as a pass or infer a product regression. The UI reload baseline is not independently confirmed by that assertion; database postconditions below were verified separately.

New copy was exercised on a real Channel target and on zero removals. New-copy Group/multiple-removal UI cases were not independently exercised in this read-only round. Existing model check already confirms a Group contributes one target label; the shared one-line dialog renders those labels as targets, not Channels. No affected-Channel or physical playback count is claimed.

## Read-only database postconditions

Before/after fingerprints and Job count matched exactly for publication f641d235…:

| Evidence | Value |
|---|---|
| Publication row MD5 | 47267f823ee848014db25fe69e798008 |
| Stored target rows MD5 | d6c4fb1731788160d878448c0f047c91 |
| Schedule rows MD5 | 542ce9da1e7064efd765aa4d29fbfb30 |
| Existing Jobs | 2 before and after; none created |

These database comparisons prove stored data unchanged, separately from the UI text assertions. No SQL mutation used. Static/model/lint/TypeScript/build checks passed in the preceding fix session; no unnecessary repeat of those checks for this documentation-only follow-up. git diff --check is run before committing this evidence.

This record supersedes the pending browser-method status in SESSIONLOG-program-target-warning-fix-2026-10-05.md. PR remains Draft; Owner controls Ready/merge. Publishing on a real row, physical Player playback and broader Figma decisions remain outside this read-only check.
