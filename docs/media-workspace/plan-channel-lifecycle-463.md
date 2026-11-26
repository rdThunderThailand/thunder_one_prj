# Plan — a Channel has one lifecycle: the stored one (#463)

Decision: `docs/adr/0129-a-channel-has-one-lifecycle-the-stored-one.md`. Read it first. Size S, one PR.

- Branch `refactor/463-channel-lifecycle`, base `dev` (squash, ADR 0118).
- Frontend only. No Core change, no migration.

## Ground rules for the executor

- Do not commit, push, open a PR or touch any database. Leave the work uncommitted and report back.
- Change only the files under **Files touched**. If another file needs a change (for example tsc
  flags a reader this plan missed), stop and report the file and line. Do not widen the scope yourself.
- If you hit a design question this plan does not answer, stop and report it. Do not decide it.
- Follow `AGENTS.md` and the code around you: JSX one element per line, no `any`, no dead code, no
  new dependencies, files ≤ 300 lines. Checks are `*.check.mts` files run with `node <file>`. There
  is no test runner; do not add one.
- Line numbers are from `dev` @ cf6e195f and may have moved. Find the code by the quoted text.

## Target shape

```ts
// channels/types/index.ts
export interface ChannelListItem {
  …
  /** Stored lifecycle (ADR 0129): Draft → Active ↔ Inactive. Read from Core's `status` key. */
  lifecycle: ChannelLifecycle;
  // `status` is gone
  …
}

// channels/lifecycle-actions.ts
/** ADR 0099 / 0129: only an Active Channel holds a device reservation, so only it can be a Program target. */
export function canBeProgramTarget(channel: Pick<ChannelListItem, "lifecycle">): boolean {
  return channel.lifecycle === "active";
}
```

## Steps

### 1. Type and parser

- `channels/types/index.ts`
  - Replace the header comment on `ChannelLifecycle` (lines 3-7). It describes the ADR 0037
    derivation, which One no longer reads. New comment: ADR 0129, the stored lifecycle
    `Draft → Active ↔ Inactive`. Device liveness stays on `devices[].health` / `health`; keep that
    sentence.
  - In `ChannelListItem`: keep `lifecycle: ChannelLifecycle` with the comment from Target shape.
    Delete the `status` field and its comment (lines 84-88).
- `channels/services/channels-api.ts`
  - `parseChannelListItem`: delete the `isOneOf(value.lifecycle, …)` check. Keep the
    `isOneOf(value.status, …)` check. In the returned object write `lifecycle: value.status` and delete
    the `status:` line. Add a one-line comment saying why: Core's `lifecycle` key is the ADR 0037
    derived value, which One does not read (ADR 0129).
  - Delete `lifecycle?: ChannelLifecycle` from `ChannelListQuery` and the
    `if (query.lifecycle) searchParams.set("lifecycle", …)` line from `buildChannelListPath`. If
    `ChannelLifecycle` is then unused in this file, remove it from the import.
- `channels/services/channels-api-contract.check.mts`
  - Lines ~22-29: drop `lifecycle: "active"` from both `buildChannelListPath` and
    `buildFetchChannelsRequest` calls, and drop `&lifecycle=active` from the expected paths.
  - Keep both raw keys in the Core-shaped `channel` fixture (~77-78); Core still sends both.
  - Lines ~211-215: replace the four `lifecycle` / `status` asserts with these:
    - `parseChannelDetail({ ...channel, lifecycle: "inactive", status: "active" }).lifecycle` equals
      `"active"`. This pins that the FE field comes from Core `status`.
    - `parseChannelDetail({ ...channel, lifecycle: undefined })` does not throw. The derived key is
      not part of the contract.
    - `parseChannelDetail({ ...channel, status: "retired" })` throws.
    - `parseChannelDetail({ ...channel, status: undefined })` throws.
    - `"status" in parseChannelDetail(channel)` is `false`.

### 2. The predicate

- `channels/lifecycle-actions.ts`
  - Add `canBeProgramTarget` exactly as in Target shape. Import `ChannelListItem` as a type.
  - Rename the `status` input of `lifecycleActionsFor` to `lifecycle` (the destructured name, the
    type field, and its three uses).
  - Rewrite the doc comment: actions follow the Channel's lifecycle (ADR 0122 rule 3, ADR 0129). Drop
    "from the STORED status … not the derived `lifecycle`", because there is only one field now.
- `channels/lifecycle-actions.check.mts`
  - Rename `status:` to `lifecycle:` in every `lifecycleActionsFor({...})` call.
  - Add asserts: `canBeProgramTarget({ lifecycle: "active" })` is true; `"inactive"` and `"draft"`
    are false.

### 3. Readers of the old `status` field → `lifecycle`

In all three `publications/` files, import the predicate with the `.ts` extension:
`import { canBeProgramTarget } from "../channels/lifecycle-actions.ts";`. It is a runtime import, and
`node *.check.mts` fails with module-not-found without the extension. `channels-logic.ts:2-3` shows the
pattern. The existing extensionless `import type` lines can stay.

| File | Today | After |
|---|---|---|
| `publications/channels-logic.ts` (`toChannelItems`, ~27) | `.filter((channel) => channel.status === "active")` | `.filter(canBeProgramTarget)` (import from `../channels/lifecycle-actions.ts`); keep the ADR 0099 comment and add 0129 |
| `publications/target-picker.ts:8` (`targetableChannels`) | `channel.status === "active"` | `channels.filter(canBeProgramTarget)` |
| `publications/problem-targets.ts` (`selectedProblemTargets`, ~27 and ~38) | `Pick<…, "id" \| "name" \| "status">`, `channel.status !== "active"` | `Pick<…, "id" \| "name" \| "lifecycle">`, `!canBeProgramTarget(channel)` |
| `channels/components/ChannelLifecycleActions.tsx` (~26, 35, 76, 87, 98) | prop `status: ChannelLifecycle` | prop `lifecycle: ChannelLifecycle`; update the uses and the doc comment at ~18 ("STORED status" → "lifecycle") |
| `channels/components/EditChannelSidebar.tsx:119` | `status={channel.status}` | `lifecycle={channel.lifecycle}` |
| `channels/components/ChannelRowActionsMenu.tsx:38` | `lifecycleActionsFor({ status: channel.status, … })` | `lifecycleActionsFor({ lifecycle: channel.lifecycle, … })` |
| `channels/components/ChannelEditorPage.tsx:141` | `allowNoPlayer={channel.status !== "active"}` | `allowNoPlayer={channel.lifecycle !== "active"}` |
| `channels/components/create-wizard/CreateChannelModal.tsx:208` | `createdChannel.status === "draft"` | `createdChannel.lifecycle === "draft"` |

Do **not** touch `PublicationTarget.status` / `target.status` in `problem-targets.ts` `problemTargets`
and `publications/types/index.ts`. That is the Program-detail target snapshot (ADR 0122 rule 17), a
different Core field with one meaning (ADR 0129 Consequences).

### 4. Readers of the old derived `lifecycle`

- **No edit, but the meaning changes:**
  - `ChannelDetailPanel.tsx` (`mediaStatus(channel.lifecycle)`);
  - `channel-logic.ts` `filterChannels` (`channel.lifecycle === filters.lifecycle`);
  - `ChannelFiltersBar.tsx` (the Lifecycle select);
  - `list-url-state.ts` (`?lifecycle=`).

  They now read the stored value, which is what ADR 0129 §3 wants. Leave their code as it is.
- `channels/components/ChannelScopePicker.tsx` (ADR 0129 §4):
  - Add an optional prop `includeInactive?: boolean` (default `false`) to the props object type at
    ~19.
  - Leave the count as it is: `activeChannels` (`lifecycle === "active"`).
  - The Channel options list:
    - when `includeInactive` is `false`, list `activeChannels`;
    - when it is `true`, list every Channel with `lifecycle !== "draft"`, as today.
  - The Channel option mapper adds `hint: channel.lifecycle === "inactive" ? "Inactive" : undefined`.
    That value can only appear when `includeInactive` is true.
  - Add one comment line above the options. It must say that Now & Next and Calendar refuse a
    non-Active Channel, while Playback Proof accepts any status (ADR 0129 §4).
- `playback-proof/components/PlaybackProofToolbar.tsx:167`: pass `includeInactive` to
  `<ChannelScopePicker>`. Leave `NowNextPage.tsx:102` and `CalendarToolbar.tsx:152` alone; they use
  the default.

### 5. Fixtures

These checks are type-checked by tsc (`tsconfig.json` includes `**/*.mts`), so any `status:` left on
a `ChannelListItem` literal fails tsc.

- `channels/channel-logic.check.mts` (~20-21, 50-51, 80-81, 117-118): delete every `status:` key on
  Channel fixtures and keep `lifecycle`. Where the two keys differed, keep the **stored** value
  (the old `status`) as `lifecycle`, and adjust any assert that depended on the derived value. Report
  each adjusted assert.
- `channels/list-filtering.check.mts` (~9-10) and `channels/create-wizard-state.check.mts` (~93-94):
  delete `status:`.
- `publications/channels-logic.check.mts`:
  - Delete `status: "active"` from the `channel()` default (~21).
  - Fixtures: `c3` → `lifecycle: "draft"`, `c5` → `lifecycle: "inactive"` (drop `status`).
  - Delete `c4` ("Empty", derived inactive / stored active). That case no longer exists.
  - Expect `["c1", "c2"]`.
  - Rewrite the comment above the assert (~64-65): only an Active Channel is publishable (ADR 0099,
    0129).
- `publications/publish-eligibility.check.mts` (~51-52) and `publications/detail-mapping.check.mts`
  (~35-36): delete the Channel's `status:`. Leave `detail-mapping.check.mts` ~93-94
  (`PublicationTarget` snapshots) and `target-picker.check.mts` ~41-46 (same) alone.
- `publications/target-picker.check.mts:15`: `lifecycle: "committed"` is not a valid value. Change it to
  `lifecycle: "active"`. The fixture is cast `as never`, so tsc does not check it; that is why the
  bad value survived. No assert covers `targetableChannels` today. Add one built from typed
  `Pick<ChannelListItem, "id" | "lifecycle">` literals (not `as never`), cast only where the function
  needs a full `ChannelListItem`: an `"inactive"` Channel and a `"draft"` one are dropped, an `"active"`
  one is kept.
- `publications/problem-targets.check.mts` (~44-46): rename `status:` to `lifecycle:` in the `list`
  fixture. Expected results are unchanged.

### 6. Checks (run all, paste the output)

```bash
grep -rnE '\.status\b' src/features/media-workspace/channels src/features/media-workspace/publications --include=*.ts --include=*.tsx --include=*.mts | grep -vE 'health|group\.status|target\.status|publication\.status|response|res\.status|filters\.status|value\.status'
```

Every hit left must be a non-Channel status (Program, Job target, Group, mock `ChannelItem`). List
each one with a word on what it is.

```bash
npx tsc --noEmit
```

```bash
npx eslint src/features/media-workspace/channels src/features/media-workspace/publications
```

```bash
for f in src/features/media-workspace/channels/*.check.mts src/features/media-workspace/channels/services/*.check.mts src/features/media-workspace/publications/*.check.mts; do node "$f" || echo "FAIL $f"; done
```

```bash
npx next build
```

CI (#483) runs install, tsc, eslint and `next build` on the PR.

### 7. Browser checklist (owner chooses who runs it, CLAUDE.md §3)

Run on local dev against develop data, as a company_admin of a tenant that has Channels. Each line
is a step and the expected result.

1. **Channels list, Lifecycle filter = Active.** It includes every committed Channel, including one
   that no Program names directly; before, that one appeared under Inactive. Inactive shows only
   deactivated Channels.
2. **Channel detail badge.** It reads Active for a committed Channel and Inactive for a deactivated
   one, matching the Deactivate/Activate card in the editor sidebar.
3. **Now & Next scope picker, Channels tab.** Only Active Channels are listed; a deactivated one and
   Drafts are absent. The "All Channels" count equals the number of Active Channels. Picking any
   listed Channel loads with no "no longer exists" notice.
4. **Calendar scope picker.** Same list as Now & Next. Picking a Channel loads with no notice.
5. **Playback Proof scope picker.** Active and deactivated Channels are listed, the deactivated one
   with the hint "Inactive"; Drafts are absent. Picking the deactivated Channel loads its proof (or
   the empty state) with no error.
6. **Create Program wizard, Channels step.** It offers only Active Channels. In Program edit,
   **Change target** offers only Active Channels.
7. **Lifecycle actions.** Deactivate, then Activate, a test Channel that is not in use. The card and
   the row menu flip each time. Editing an Inactive Channel still allows "No player".
8. **Create wizard.** Save a Channel without a Player. The success card shows the Draft wording.

### 8. Report back

- `git status` and `git diff --stat`.
- The output of every check in step 6.
- Each fixture assert you adjusted in step 5 and why.
- Any file outside **Files touched** that you had to stop for.

## Not in this plan

- Removing Core's derived `lifecycle`, `publication_count` and `p_lifecycle` from `channel_rows`
  (ADR 0129 §6). Do it the next time Core changes that function for another reason.
- The Channel Group member pickers do not filter by lifecycle (ADR 0129 Consequences). This is a
  separate issue if wanted.
- Renaming `channelStatus()` / `ChannelStatusFilter`. They already mean Player health, which matches
  the glossary.
- `CONTEXT.md`: no change. The **Channel** entry already describes the stored lifecycle.

## Files touched

Edit:

- `src/features/media-workspace/channels/types/index.ts`
- `src/features/media-workspace/channels/services/channels-api.ts`
- `src/features/media-workspace/channels/services/channels-api-contract.check.mts`
- `src/features/media-workspace/channels/lifecycle-actions.ts`
- `src/features/media-workspace/channels/lifecycle-actions.check.mts`
- `src/features/media-workspace/channels/components/ChannelLifecycleActions.tsx`
- `src/features/media-workspace/channels/components/EditChannelSidebar.tsx`
- `src/features/media-workspace/channels/components/ChannelRowActionsMenu.tsx`
- `src/features/media-workspace/channels/components/ChannelEditorPage.tsx`
- `src/features/media-workspace/channels/components/create-wizard/CreateChannelModal.tsx`
- `src/features/media-workspace/channels/components/ChannelScopePicker.tsx`
- `src/features/media-workspace/playback-proof/components/PlaybackProofToolbar.tsx`
- `src/features/media-workspace/channels/channel-logic.check.mts`
- `src/features/media-workspace/channels/list-filtering.check.mts`
- `src/features/media-workspace/channels/create-wizard-state.check.mts`
- `src/features/media-workspace/publications/channels-logic.ts`
- `src/features/media-workspace/publications/channels-logic.check.mts`
- `src/features/media-workspace/publications/target-picker.ts`
- `src/features/media-workspace/publications/target-picker.check.mts`
- `src/features/media-workspace/publications/problem-targets.ts`
- `src/features/media-workspace/publications/problem-targets.check.mts`
- `src/features/media-workspace/publications/publish-eligibility.check.mts`
- `src/features/media-workspace/publications/detail-mapping.check.mts`

Read only (their meaning changes, the code does not): `channels/components/ChannelDetailPanel.tsx`,
`channels/channel-logic.ts`, `channels/components/ChannelFiltersBar.tsx`, `channels/list-url-state.ts`.

Docs (already written by the grill, ship in the same PR): `docs/adr/0129-a-channel-has-one-lifecycle-the-stored-one.md`,
the `Amended by` lines in `docs/adr/0037-channel-status-derived-from-publications.md` and
`docs/adr/0099-programs-reach-only-active-channels.md`, and this plan.

## Overlap

- **#459 (editor lifecycle, wave 2):** none of the files above. Its list is playlists, compositions,
  layouts, the new `editor-lifecycle/` module, and `PublicationEditPage.tsx` (import path only).
- **#461 (Schedule module, wave 2):** none of the files above. It reworks `publications/schedule*.ts`,
  `usePublishDraft.ts`, the Review/Publish steps and Program Detail. This plan only changes the
  *inside* of `toChannelItems`, which `ReviewStep.tsx` / `ReviewTargets.tsx` call. Their call sites do
  not change, and neither does `ChannelItem`.
- **Playback Proof / Calendar / Now & Next:** only `PlaybackProofToolbar.tsx` changes (one prop).
  No open wave touches it.
- **#479 (fix links on refusals, later):** it will likely touch `ChannelLifecycleActions.tsx` and
  `ChannelRowActionsMenu.tsx`, where this plan renames the `status` prop and argument to `lifecycle`.
  Run #479 after this PR merges, or rebase it onto this PR.
- **Any open branch** that reads Channel `.status` will fail tsc after this merges. That is wanted. A
  branch that reads `.lifecycle` gets the stored value with no error, which is the meaning every caller
  wanted (ADR 0129 Context).
