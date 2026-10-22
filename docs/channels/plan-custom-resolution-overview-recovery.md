# Custom resolution: Overview recovery and permanent fix

Status: implementation and review complete; preparing the authorized commit, push, and Thai Draft PR for v0.14.1. Automated checks/build and browser verification with synthetic local fixtures passed. Real deployed HTTP/save verification remains outstanding. Production writes, merge, tag, and deployment are not authorized.
Date: 2026-10-22 (Asia/Bangkok).

## Active hotfix plan

### Decisions accepted by the user

- Q1: fix the Channel response parser, preserve the current custom resolution as a visible option in the edit form, and add regression checks.
- Q2: expected-resolution reads follow the existing Core contract exactly: NULL or `/^[1-9]\d{2,4}x[1-9]\d{2,4}$/` (each dimension 100 through 99999, lowercase ASCII `x`, no leading zeros).
- Existing preset choices remain conveniences, not the set of valid Channel dimensions. No new custom-dimension input UI, backend change, migration, or Overview loading refactor is included.
- No new ADR is needed: this restores an existing Core contract rather than introducing an architectural trade-off. The glossary distinguishes presets from Channel display expectations.

### Workaround status

The user reported completing the field workaround. A fresh read confirmed both identified `expected_resolution` fields are NULL, with revision still 1. Dragon Eyes updated_at is `2026-10-22T07:23:11.629305+00:00`; Looker สุรวงศ์ updated_at is `2026-10-22T07:23:38.820738+00:00`. This confirms the DB state only; production browser recovery was not re-verified in this planning turn. No production writes were performed by this agent.

The old Phase 1 SQL below is historical and its preconditions are now stale. Do not execute it. Restoration must use a new preflight and separate authorization after the hotfix is live.

Recovery gate from independent review: do not save edits to the two workaround Channels until the frontend fix is deployed and their original dimensions are restored. `draftFromChannel` currently converts a NULL expectation to `1920x1080`, and the update payload sends that value even after a name-only edit (`create-wizard-state.ts:133`, `:102`; `ChannelEditorPage.tsx:89`). The reviewer reproduced this through the real pure functions locally. The current-option hotfix does not change nullable-draft semantics. If an operator has edited either Channel meanwhile, stop automatic restoration and reconcile the fresh row rather than overwrite it.

### Implementation sequence

1. Completed: refreshed remote refs and created `codex/hotfix-channel-custom-resolution` from `origin/main` at `7e449cd` (v0.14.0). Release preparation refreshed origin again and confirmed the same baseline. Preserve unrelated `HANDOFF.md`; do not promote unrelated `dev` work.
2. In `src/features/media-workspace/channels/services/channels-api.ts`, replace the preset-only expected-resolution predicate with the exact accepted Core expression above. Remove the now-unused `isDisplayResolution` import. Leave the existing general Player-resolution parser unchanged; it accepts broader values and is not the chosen expected-resolution contract.
3. In `src/features/media-workspace/channels/components/ChannelEditorForm.tsx`, add the current `draft.screenResolution` as an option when it is absent from the existing preset options. Reuse the pattern in `src/features/media-workspace/channels/components/create-wizard/Step2Setup.tsx`. Preserve the selected value and the existing change behavior. No styling redesign or new input control.
4. Extend the existing Channel contract check with a mixed list containing `6912x700`, `1440x900`, a standard preset, NULL, and a multi-screen canvas. Cover detail parsing and invalid strings: zero, negative, leading zeros, uppercase/multiplication-sign separators, under/over-bound dimensions, and trailing text. Cover valid boundary dimensions without inventing new bounds.
   Replace the existing assertion that rejects `1600x900` (`channels-api-contract.check.mts:164`) with an accepted custom-size case; retaining it would contradict Q2.
5. Extend `create-wizard-state.check.mts` at the real `draftFromChannel` to `toUpdateChannelPayload` seam: an unrelated edit retains each custom dimension and multi-screen display_config. Run the browser form check to verify the actual selected option; a pure payload test alone cannot verify DOM selection. Follow the installed test-writing delegation workflow when implementing.

### Verification and acceptance

- Run `node src/features/media-workspace/channels/services/channels-api-contract.check.mts` and `node src/features/media-workspace/channels/create-wizard-state.check.mts`.
- Run the existing display-structure check if changes affect its inputs, targeted lint on changed code, and project type/build gates required by `docs/agents/versioning.md`. Record exact commands and outcomes; do not invent an `npm test` script.
- Before final browser verification, let the user choose agent browser verification, a user-run checklist, or skipping with an explicit unverified status, as required by the working agreement.
- Browser cases: mixed custom/preset/NULL Channels load in All Channels and Overview; custom dimensions appear in detail and as the selected edit option; changing only a name retains dimensions after save/reopen; presets and multi-screen values still work. Reads and save probes must target an approved test environment/record. Any production write probe requires separate approval.
- Do not restore production dimensions as an unapproved test fixture. Keep original-dimension parser/payload checks local until a safe browser fixture is arranged or restoration is authorized after deployment.
- Known pre-existing multi-screen write blocker: `display-config.ts:45` generates screen indices starting at 0, while Core's Channel schema (`src/app/api/core/v1/media/channels/schema.ts:31`) requires positive indices. The reviewer reproduced schema rejection of a normal zero-indexed payload using local source; cached Core origin/main has the same rule. This is not deployed-runtime proof. Track separately from this hotfix and distinguish read parsing, value-preserving payload generation, and server save acceptance. Do not claim multi-screen end-to-end save verification from a passing pure round-trip check. If a browser save encounters this failure, report that layer as blocked without silently expanding this hotfix.

### Release and recovery

- Prepare patch v0.14.1 per `docs/agents/versioning.md`, targeting main and then returning the fix to dev after authorized merge. Refreshed origin/main remains at v0.14.0. The package version bump does not mean the patch is deployed or tagged.
- Ask the PR language only when preparing the PR. Verification incomplete means Draft; the agent does not mark Ready. A main merge may deploy production immediately, so merge/deploy remain explicit approval boundaries, as do commit, push, and tag publication.
- After authorized deployment, obtain separate approval to restore only the two original dimensions. Re-read tenant/ID/current NULL/revision/updated_at, guard on that fresh state, restore `6912x700` and `1440x900`, and increment revision. Read back and verify authenticated API plus browser behavior. Stop on intervening changes.
- If rollback is necessary after restoration, NULL workaround must be re-approved and verified before reverting to the old frontend, otherwise the known parser failure returns. There is no schema rollback.
- SESSIONLOGs record implementation and local-browser evidence. Commit/push/Draft PR are now authorized; merge/deploy, tag, and production restoration remain separate approvals.

### Remaining confirmation

Q1/Q2, implementation, local-fixture browser verification, commit/push and a Thai Draft PR are authorized. Merge/deploy, tag publication and production restoration remain separate approval gates. Do not mark the PR Ready.

### Implementation evidence (2026-10-22)

- Fetched origin and created `codex/hotfix-channel-custom-resolution` from `origin/main` at `7e449cd` (package version `0.14.0`). No version bump yet; next patch candidate is `0.14.1`, subject to rechecking the release baseline.
- Implemented the exact Core expected-resolution expression in the shared list/detail parser and added the selected custom option to `ChannelEditorForm`. Existing general Player resolution guard, presets, backend, and nullable-draft behavior remain unchanged.
- Test-only executor extended the two existing checks; parent independently ran them. Before the parser fix the contract check failed at the mixed custom list with `Channel data is malformed`; after the fix it passed. The state test initially over-compared arrangement UI metadata; corrected it to check mode, rows/cols, screens, NULL derived canvas write value, and revision. State preservation was already supported; its passing check does not prove the select DOM behavior.
- Passed: Channel API contract check, create-wizard-state check, display-structure check, targeted ESLint on the four changed source/check files, standalone `pnpm exec tsc --noEmit`, `pnpm exec next build` (114 static pages), and `git diff --check`.
- Initial standalone tsc failed on stale `.next/dev/types/validator.ts` referencing an absent Asset Workspace settings route. `next typegen` alone did not fix this dev cache. Preserved `.next/dev/types` at `/private/tmp/thunder-one-stale-dev-types-20261022-custom-resolution`; standalone tsc then passed. No tracked source was changed to suppress the error.
- Initial sandbox build failed downloading three Google Fonts. Build with approved network access passed. `pnpm install --frozen-lockfile --offline` aborted because pnpm requested modules-directory removal without a TTY; no forced purge/reinstall was attempted and no dependency/lockfile changed. Build used existing installed dependencies; clean frozen-install reproducibility remains unverified.
- The user selected browser verification with local fixtures. Executed the shared parser, actual ChannelTable, Overview StatCardsRow, ChannelStructureTree and ChannelEditorForm with five synthetic mixed-size Channels. Both custom selected options rendered correctly; name-only local saves and selecting the rows again preserved `6912x700` and `1440x900`. Preset selection still worked. NULL parsed and rendered without a list failure, while the known edit fallback remained 1920x1080. Multi-screen layout and local payload retained its three screen mappings; this does not verify Core write acceptance. Browser error/warning log was empty.
- Browser fixture saves used only React state plus real payload builders/parser; no updateChannelV2 or backend save was called. Temporary fixture source was removed, its route then returned 404, and the tab was closed. Screenshot: `/private/tmp/channel-resolution-hotfix-20261022.jpg`. See the separate browser SESSIONLOG for exact scope.
- No production HTTP save test, deployment, dimension restoration, commit, push, tag, or merge has been performed for this implementation. Existing unrelated `HANDOFF.md` was preserved.

### Independent scrutinize review

Verdict: fix-then-ship. The reviewer confirmed the shared list/detail parser and Overview call path, and the existing custom-option pattern. The two recovery/verification findings above have been incorporated into the plan. No implementation or production write was performed during the review. Review evidence is local pure-function/schema probes and source inspection, not a deployed Core/browser save test.

Post-implementation independent review: **ship within the accepted scope**, with no new actionable findings before commit. The reviewer traced actual list/detail and editor-save paths, confirmed exact Core regex agreement and preserved custom option/payload behavior, and independently ran API contract, create-wizard-state and display-config checks successfully. Browser/build were not rerun by the reviewer; real Core save remains unverified. See `.docs/REVIEW-channel-custom-resolution-hotfix-2026-10-22.md`. This verdict does not authorize commit, push, PR, merge, deploy or production restoration.

Release-preparation authorization was subsequently given by the user. Preparing v0.14.1 and a Thai Draft PR; merge/deploy and restoration are still pending. Committed synthetic screenshot: `docs/channels/evidence/channel-resolution-hotfix-20261022.jpg`. Update the release ledger in `docs/agents/versioning.md` with the actual PR/merge after the release occurs, and return main to dev after authorized merge.

## Evidence

Production project: ThunderCore (`sfiefevtxalqjizdkcsw`).
Tenant: Looker Media (`f2f4d496-ea70-49b4-b943-d3ec9d5b165d`).

The Channel response parser rejects custom `expected_resolution` values because it uses the four-entry preset guard from `src/lib/display-resolution.ts`. One rejected row rejects the list, which fails the shared Overview load.

The database column is nullable. Its live CHECK accepts NULL or a custom dimension string. Core's Channel write schema already accepts custom dimension strings using `/^[1-9]\d{2,4}x[1-9]\d{2,4}$/`. ChannelListItem already types this field as `string | null`. No new data-model choice or database migration is required for the immediate parser fix.

At the initial investigation there were two Channels. A third Channel appeared during follow-up. The latest payload has two blockers:

| Channel | ID | Original expected_resolution | Revision |
| --- | --- | --- | --- |
| Dragon Eyes พัทยาใต้ เทพประสิทธิ์ | e1f29ff8-0ca7-4da1-86fb-74b252929189 | 6912x700 | 1 |
| Looker สุรวงศ์ New Sp-1/Aurora | 7a9778d3-0172-479e-b449-101dda89e709 | 1440x900 | 1 |

Both have `display_config = null`. The third Channel uses the accepted `1920x1080` preset and needs no workaround.

Verification: the actual local parser rejected each custom row. Replacing only the two custom values with NULL in a cloned live payload made all three rows parse. No production data was changed. This is parser-layer evidence; post-change production HTTP and browser behavior remain unverified.

## Phase 1: optional temporary recovery

Historical proposal, superseded by the completed user workaround above. The SQL snapshot below is stale and must not be run.

Purpose: restore Channel and Overview loading while the frontend fix is prepared.

Change `media_core.channels.expected_resolution` to SQL NULL for exactly the two rows above. NULL means the expected dimensions are unspecified; it does not set or resize the actual Player screen. Preserve the original values in this plan for restoration. Do not substitute an inaccurate standard resolution.

Risk: dimension-dependent display and compatibility behavior will lack these expected values. Treat this as dashboard/list recovery, not playback verification. Restore the original values before relying on resolution compatibility checks or publishing custom-size content. Additional custom-resolution Channels created before the frontend fix can reproduce the failure.

If performed through SQL, increment `revision` to invalidate stale edit forms. The existing `trg_channels_updated_at` trigger also updates `updated_at`. No Player, Asset, binding, status, or orientation field is intentionally changed.

The following is a proposed production write, NOT executed. Re-read both rows before approval. If values, revision, timestamps, or scope changed, stop and refresh this preflight.

```sql
begin;
do $$
declare
  affected integer;
begin
  update media_core.channels
  set expected_resolution = null,
      revision = revision + 1
  where tenant_id = 'f2f4d496-ea70-49b4-b943-d3ec9d5b165d'
    and revision = 1
    and display_config is null
    and (
      (id = 'e1f29ff8-0ca7-4da1-86fb-74b252929189'
       and expected_resolution = '6912x700'
       and updated_at = '2026-10-22T07:00:34.975788+00:00'::timestamptz)
      or
      (id = '7a9778d3-0172-479e-b449-101dda89e709'
       and expected_resolution = '1440x900'
       and updated_at = '2026-10-22T07:20:15.733425+00:00'::timestamptz)
    );
  get diagnostics affected = row_count;
  if affected <> 2 then
    raise exception 'Expected exactly 2 unchanged Channels; matched %. Transaction aborted.', affected;
  end if;
end $$;
select id, name, expected_resolution, revision, updated_at
from media_core.channels
where tenant_id = 'f2f4d496-ea70-49b4-b943-d3ec9d5b165d'
  and id in ('e1f29ff8-0ca7-4da1-86fb-74b252929189', '7a9778d3-0172-479e-b449-101dda89e709');
commit;
```

Postconditions: exactly two NULL values, each revision incremented once; fresh authenticated production `/api/proxy/media/channels` response parses; All Channels lists all current rows; Overview Channel cards no longer show the parser error. Ask for the user's browser verification method under the repository working agreement before final verification.

## Phase 2: smallest permanent fix

1. In `channels/services/channels-api.ts`, replace the preset-only expected-resolution guard with a predicate matching Core's existing `/^[1-9]\d{2,4}x[1-9]\d{2,4}$/` contract, as accepted in Q2. Remove the preset guard import if unused. Do not reuse or alter the broader Player `isResolution` guard.
2. Extend the existing `channels-api-contract.check.mts` check with mixed custom/preset/NULL rows, custom detail parsing, and rejection of zero, negative, and malformed dimension strings. Follow the installed test delegation workflow when implementing.
3. Confirm Channel detail displays the original dimensions and existing create/edit flows preserve them on an unrelated edit. Inspect actual form paths before editing; only change a form if it still enforces or silently replaces presets. Do not broaden Playlist presets as part of this Channel fix.
4. Run the focused Channel contract check and relevant existing checks, then lint/type checks appropriate to the changed files. Verify mixed-size Channels and Overview in the selected browser verification flow. Static checks do not establish production behavior.
5. Deploy only after explicit authorization. No backend deploy or migration is planned unless implementation discovers an additional verified blocker.

The remaining primary fix is execution against an existing contract; there is no need to introduce a new resolution data model.

## Phase 3: restore expectations

After the frontend fix is live, re-read each target row. With separate production-write approval, restore `6912x700` and `1440x900` respectively. Guard on tenant ID, Channel ID, current NULL, and the freshly observed revision and updated_at; increment revision again. Do not restore an old revision or overwrite intervening user changes. If a user has already supplied another resolution, stop and reconcile.

Read back both values, verify the authenticated Channel API, All Channels, Overview, and unchanged-dimension save behavior. Physical Player playback remains a separate verification task.

Rollback before the frontend deployment can restore the original values with the same concurrency guards, but it will also restore the original frontend parser failure.

## Deferred

Isolating Channels and Publications failures in Overview is useful resilience work but is not needed for this parser fix. Delivery analytics placeholders and physical playback are outside this plan.
