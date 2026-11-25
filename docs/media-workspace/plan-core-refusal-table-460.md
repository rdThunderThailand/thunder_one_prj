# Plan — one table turns Core refusals into user text (#460)

Issue: https://github.com/rdThunderThailand/thunder_one_prj/issues/460 (tracking #464).
Decision: [ADR 0126](../adr/0126-one-table-turns-core-refusals-into-user-text.md). Read it first.
Base: `dev` @ 5fa687f8. Branches: see Status (two PRs). Risk: R1 (cross-file,
reversible, no backend change).
Behaviour must not change, except where ADR 0126 §7–§8 says so. Appendix A lists every change §8
allows, and the owner has signed it off. Any change on a screen that is not in Appendix A is a bug in
this work.

**Status.**

- **Phase A (steps 1 and 1b, no code): done.** Its results are Appendix B (fixtures) and Appendix A
  (wording, signed off).
- **Phase B (steps 2–7): ready to run, as two PRs (owner, Q24).** Use Appendix B as the fixture
  source. Re-check a row against Core only when you doubt it.

**PR 1 — `refactor/460-core-refusal-table`.** Base: `dev`.

- Steps 2, 2b and 3.
- Step 4 rows for Playlists, Layouts, Templates, Publish changes and Programs.
- Step 5 groups Playlists/Layouts/Templates and Programs.
- Step 6 for the same.
- **Channels and Channel Groups files are not edited in PR 1.** Keep `isDuplicateName`,
  `isSyncConflict`, `isChannelGroupSyncConflict`, `groupInUseNames` and `delete-refusal.ts` exported
  and working; PR 2 deletes them. `isConflict` may go in PR 1, if no Channels file imports it.
- Channels screens still change in two ways in PR 1, through `classifyApiError`: the generic
  `Invalid input:` line and the table's Thai lines for errors they do not catch themselves. Both
  are in Appendix A.

**PR 2 — `refactor/460-channels-refusals`.** Starts from `dev` after PR 1 merges.

- The Channels and Channel Groups rows of step 4.
- Their step 5 group.
- The A.7 Thai lines, both refusals and fallbacks.
- Their step 6 asserts, including `channel-groups-api-contract.check.mts`.
- The Channel `Already active:` line.
- Run the step 5 leftover grep in full only at the end of PR 2. At the end of PR 1, only the Channels
  hits may remain.

## Ground rules for the executor

- **Core text comes from Core `origin/main` and `origin/develop`, live definitions only** (ADR 0126
  Context).
  - The Core checkout at `/Users/arty/Desktop/Thunder/project/Thunder_Core` is on another branch.
    Never read its working tree. Run `git -C … fetch origin main develop` first.
  - A text is live on a branch if one of these holds:
    - the **latest** migration that defines the raising function still raises it (a hit in an older
      migration whose function was later replaced does not count);
    - a Core media route (`src/app/api/core/v1/media/**`) throws it.
  - Find hits with `git -C … grep -n -F '<text>' origin/<branch> -- 'supabase/migrations/2*.sql' 'src/app/api/core/v1/media'`.
    Then confirm with `git show origin/<branch>:<file>` that the hit is in the function's latest
    definition.
  - `_archive/` does not count.
- **No new dependency, no test runner.** Checks run with `node <file>.check.mts`.
- **Do not commit, push or apply anything.** Do not stage
  `docs/prototyping/po-env/scripts/sync-from-thunder-one.sh` or the untracked
  `src/features/media-workspace/media-workspace`.
- **Stop and report instead of deciding** if any of these happens:
  - a caller needs a `reason` not in the ADR's first set;
  - a Core message seems to need different meaning on different screens;
  - a matched text you expected to be live has no live source, or one the ADR lists as dead does
    have one;
  - a caller branches on `kind === "retryable"`, other than `CreatePublicationPage.tsx:369` (known,
    stays correct), in People or Media.
- **Read each caller before you change it.** Comments in this code have been wrong before (#456).
- **Conventions:**
  - Files ≤ 300 lines, no `any`, no dead code.
  - JSX one element per line.
  - Thai sentences keep English domain nouns (Channel, Group, Program, Layout, Template, Player, Zone),
    using the UI vocabulary in `CONTEXT.md`.

## Steps

### 1. Fixture inventory (no code yet)

For every match listed in step 4, record four things:

- the live Core message;
- the RPC or route that raises it;
- the migration or route file;
- the branch it is live on (`main`, `develop` or both).

The ADR lists the branches that never fire, and you will delete them. Confirm each one against both
branches, and list them in the report:

- `isUnapprovedAsset` in `api-error.ts`
- `direct-target publication on` in `publish-cause.ts`
- `more than 4 zones` in `layouts/status-display.ts`
- `used by (\d+) publication` in `playlists/status-display.ts`
- `quarantin` in `REASONS`
- `duplicate key|unique constraint`
- the `Already exists` branch of `layouts/status-display.ts`
- the `Already in use:` branch of `playlists/status-display.ts` (`media_video_delete` dropped)
- the `isDuplicateName` arm of `UngroupedChannelsTable.tsx:35`

Known live on `main` only: the channel delete `…playback history…` text. Keep its rule.

### 1b. Wording table (no code). Stop here and report.

For every screen where the Thai line or the `kind` will differ after the change, write one row:
screen (file:line) · Core message · shown today · shown after. Include at least:

- **Publish changes:** `REASONS` short lines vs the `publish-cause.ts` lines the inner message would
  get.
- **Program edit:** messages with a `[part]` tag show Core's raw English today. Show what they become.
  Note any that newly gain a `cause`, such as `not found: [content] composition not found` →
  `no-content`.
- **Sync conflict:** three different lines today, in `ManageChannelsModal`, `CreateEditGroupModal`,
  `UngroupedChannelsTable` and `ChannelGroupsPickerModal`. Propose the one line.
- **Template pages:** `LayoutEditorPage` and `LayoutsListPage` show `Already exists` and `zones … overlap`,
  against what the Layout save shows.
- **Parser fallbacks:** "บันทึก Layout ไม่สำเร็จ…", "ลบ playlist ไม่สำเร็จ…" and the like. Each moves
  to the caller's `fallback` argument, so what it shows today keeps showing. Say for each one whether
  it does.
- **Playlist trash:** `PlaylistsListDialogs.tsx:54` sends every error (403/404/network) to
  `describeDeleteError` today.
- **Channels:** every English refusal line, and each caller's English `fallback` (ADR §8 pending item).
  Give both options: Thai, or unchanged.

Propose one Thai line per Core message ("convergence", ADR §8). Where you think a screen needs its own
wording, flag it with why. Do not add a `reason` for it yourself.

### 2. `src/lib/api/core-refusal-rules.ts` (new)

- **The table:** one exported, ordered, readonly array of rules.
  - Each rule has a `prefix` (one of `Invalid input: `, `not found: `, `Already exists: `,
    `Already in use: `, `Already modified: `, `Already active: `).
  - It has a `match` (phrase or regex tested on the text after the prefix).
  - It has a `build` that returns `{ kind, message, reason?, cause? }`. `names` is set only by the
    program unwrap.
  - `Already active:` is a table row (kind `already-active`), not a separate check.
  - Order traps found in Phase A:
    - `use End program` must come before plain `[schedule] end time is in the past`.
    - The `cannot remove % while these publications target this channel` rule must not be shadowed
      by `these publications still target this channel`.
    - The set_zones refusal `Invalid input: cannot leave an active composition incomplete — zone(s) %
      are unbound` (latest definition: `20261120150000_what_holds_a_playlist.sql`) is a table row that
      must come **before** the call to `classifyPublishCause`, whose `/zone\(s\) .+ are unbound/` would
      otherwise claim it. It carries no `cause` and uses its own line (A.8 #1).
    - `stale-draft` (`not found: publication not found for this tenant`, raised by ~13 RPCs) adds
      `reason` only and keeps today's 404 line.
- **Order:** most specific first. Keep today's precedence, which `api-error.check.mts` pins. Publish
  causes and channel guards are delegated to `classifyPublishCause` / `inactiveChannelMessage` at the
  position they hold today.
- **Two unwrap steps, before the table:**
  - `Invalid input: program "<name>" — <inner>` → run `<inner>` through the table and
    `classifyPublishCause` only, not through the generic `Invalid input:` line. Then add
    `reason: "program-refused"` and `names: [name]`.
    - If `<inner>` matches no rule, the message is `ไม่ผ่านเงื่อนไขการ Publish`, which is today's text.
    - A message with no wrapper falls through to the caller's `fallback`. That fallback is today's
      "Publish ไม่สำเร็จ ยังไม่มีการเปลี่ยนแปลงกับ Program ใดเลย" (`publish-changes-api.ts:41`).
  - The Program edit `[details|content|targets|schedule|publish]` tag sets `part`.
    - `part` comes from the first tag in the message.
    - **`classifyPublishCause` always gets the raw message, tag included.** Core writes `[schedule]`
      into the text itself (`Invalid input: [schedule] end time is in the past` from
      `media_publication_activate`; `[schedule] … use End program` from `update_published`).
      `publish-cause.ts` matches on it, so stripping it first would lose `schedule-ended` on every
      page.
    - If the raw message gives no cause, the table and `classifyPublishCause` run on the message with
      the tag stripped. That is how `not found: [content] composition not found` gets `no-content`
      (A.2).
    - Checks: a raw activate refusal with no part still gets `schedule-ended`; `[schedule] … use End
      program` still gets no cause; `[content] composition not found` gets `part: "content"` and
      `no-content`.
- **Types:** export `RefusalReason` (union: `duplicate-name | needs-confirm | stale-draft |
  program-refused`) and `ProgramPart`.

### 2b. `src/lib/api/publish-cause.ts`: two edits, nothing else

- **`layoutNotReadyMessage` (unbound Zones):** the message becomes the line signed off in A.1 for
  `zone(s) … are unbound`. The matcher does not change.
- **`syncGroupMessage`:** delete the `direct-target publication on (.+?) — synchronized playback is
  enabled` branch, which is dead on both branches (ADR §7).
- Update the asserts in `api-error.check.mts` that pin either one (around lines 199–200 and 219), and
  name them in the report.

### 3. `src/lib/api/api-error.ts`

- `ClassifiedError` gains `reason?`, `names?` and `part?` (ADR §4).
- `classifyApiError` keeps its signature. It keeps the order below and runs the table at the position
  of today's string branches:
  1. `UserFacingError`
  2. the table
  3. the generic `Invalid input:` line
  4. 403
  5. 404
  6. transport failure
  7. fallback
- **Changes inside `classifyApiError`:**
  - `isAlreadyActive` becomes `message.startsWith("Already active:")`.
  - Delete `isUnapprovedAsset`, along with its branch.
  - The non-`ApiError`, non-transport branch returns `kind: "rejected"`. Fix its comment so it says
    what the code does.
  - Do **not** treat every `TypeError` as transport. The repo throws its own
    `new TypeError("Malformed …")` in parsers (`channel-groups-api.ts`, `channels-api.ts`), and
    runtime bugs are `TypeError` too.
  - Instead, `publications/services/tus-upload.ts:15-21` turns its `fetch` network failure into a
    transport error where it catches it: rethrow it with `code: "ERR_NETWORK"`, the axios code
    `isTransportFailure` already knows. Keep its existing timeout branch.
  - Check: `new TypeError("Malformed …")` → `rejected` + fallback; an error with `code: "ERR_NETWORK"`
    → `retryable` + the connection line.
- **Delete** the exports `isConflict` and `isDuplicateName`.
- **People:** `classifyApiError` is also used by
  `src/features/people/add-person/components/Add{Bulk,Contractor,Employee}WizardPage.tsx`. Confirm
  none of them branches on `retryable`. Do not otherwise touch them.

### 4. Move every feature parser into the table, then delete it

All paths are under `src/features/media-workspace/`. Each one becomes a rule (or several), and the
old function is deleted.

| Today | Becomes |
|---|---|
| `channel-groups/services/channel-groups-api.ts` `isSyncConflict` | one sync-conflict rule (all live phrases); Thai message from today's Channel Groups text |
| `channels/services/channels-api.ts` `isChannelGroupSyncConflict` | same rule |
| `channel-groups/services/channel-groups-api.ts` `groupInUseNames` | rule with `names` |
| `channels/delete-refusal.ts` (whole file) | rules with `names`; Thai messages (ADR §8) |
| `channels/components/ChannelEditorPage.tsx` `isPlayerChangeBlocked`, `confirm to continue` | rules; `confirm to continue` gets `reason: "needs-confirm"`; Thai messages |
| `playlists/status-display.ts` `describeDeleteError` | rules; the file keeps its badge map |
| `compositions/status-display.ts` `describeSaveError`, `describeActivateError` | rules; file keeps its badge map |
| `layouts/status-display.ts` `describeSaveError` | rules; file keeps its badge map |
| `publish-changes/publish-changes-api.ts` `REASONS`, `describePublishChangesError` | program unwrap (step 2) + the table |
| `publications/hooks/usePublishDraft.ts` `isStaleDraftError` | rule with `reason: "stale-draft"` (both live phrases) |
| `publications/program-edit.ts` `parseUpdatePublishedError`, `PART_TAG` | the part unwrap (step 2); `isStale` is `kind === "conflict"` |

Thai wording: use the lines exactly as the owner signed them off in the 1b table. Write none of your
own in Phase B.

### 5. Callers: branch on `kind` / `reason` / `cause` / `part` only

Read each caller, replace its message matching, and keep its behaviour.

**Channels and Channel Groups**

- `channels/components/create-wizard/CreateChannelModal.tsx:133-143`
  - `duplicate-name` → step 1 + message.
  - `needs-confirm` → reset confirmation + refresh candidates.
- `channels/components/ChannelEditorPage.tsx:94-106`
  - `duplicate-name` → name field.
  - `needs-confirm` → reset + refresh.
  - Everything else → `setSaveError(message)`.
- `channels/components/DeleteChannelDialog.tsx:69`
- `channels/components/ChannelGroupsPickerModal.tsx:60`
- `channel-groups/components/CreateEditGroupModal.tsx:67-72`
- `channel-groups/components/ManageChannelsModal.tsx:26`
- `channel-groups/components/UngroupedChannelsTable.tsx:35`
- `channel-groups/components/ChannelGroupInspector.tsx:69`

**Playlists, Layouts and Templates**

- `playlists/components/PlaylistsListDialogs.tsx:54`
- `playlists/components/usePlaylistEditorRow.ts:122` (`isConflict` → `kind === "conflict"`)
- `layouts/components/LayoutEditorPage.tsx:158`
- `layouts/components/LayoutsListPage.tsx:114`
- `compositions/hooks/useCompositionSave.ts:29-30`

The last three lose their `startsWith("Invalid input:")` / `startsWith("Already")` gates, because the
table covers every prefix.

**Programs**

- `publications/components/LayoutZonePlayModeControl.tsx:62`
- `publications/hooks/usePublishDraft.ts:264-280` (also replace `classifyApiError(err, err.message)`
  at :276 with a Thai fallback, so raw text cannot leak through the fallback)
  - `reason === "stale-draft"` → save as new.
  - `kind === "conflict"` → revision conflict.
- `publications/hooks/useProgramEdit.ts:95-101` and `publications/components/PublicationEditPage.tsx:94-104,229`:
  `part` / `kind === "conflict"` / `cause` replace `parseUpdatePublishedError`.
- `publish-changes/PublishChangesDialog.tsx:66`: Program name from `names[0]` when
  `reason === "program-refused"`.

**Search for leftovers**

After the edits, run:

```
grep -rnE "\.message\.(startsWith|includes)|\.test\(\w*\.message|isConflict|isDuplicateName" src/features/media-workspace src/lib/api
```

Every hit must be gone, or be named in the report with the reason it stays. The expected stays are
predicates on frontend-authored errors (#456), such as the upload `namedError` tags.

### 6. Checks

- **`src/lib/api/api-error.check.mts`**
  - Keep every assert whose behaviour is unchanged.
  - Update the ones ADR §7–§8 changes, and name each one in the report.
  - Add one fixture per rule: the live Core text plus a comment naming the RPC and migration file.
    Assert `kind`, `reason` and `names`, and that `message` contains no ASCII sentence from Core.
  - Add one assert that every table rule's `prefix` is one of the six allowed.
- **Assert files that lose their error asserts** (the asserts move here):
  - `channels/delete-refusal.check.mts`. The file goes when `delete-refusal.ts` goes.
  - `channel-groups/services/channel-groups-api-contract.check.mts:3,25-31`. It imports
    `isSyncConflict` and `groupInUseNames`, so it breaks as soon as they are deleted. Move those
    asserts and keep the parse asserts.
  - The error parts of `playlists/`, `compositions/` and `layouts/status-display.check.mts`.
  - `publications/program-edit.check.mts`.
- **Run, all must exit 0:**
  - `node src/lib/api/api-error.check.mts`
  - every `*.check.mts` in a folder you touched
  - `npx tsc --noEmit`
  - `npx eslint` on the changed files

### 7. Report back

- Fixture table: rule → live Core text → RPC → migration file.
- Confirmed dead texts.
- Thai lines added, before → after.
- Asserts changed, and why.
- grep leftovers.
- Check outputs.
- Anything you stopped on.

## Not in this plan

- **Vocabulary on lines this PR does not rewrite.** `inactiveChannelMessage` and the other
  `publish-cause.ts` lines say "ช่องทาง/กลุ่ม" where Appendix A says Channel/Group. They stay as they
  are (follow-up), and the ground rule on UI vocabulary applies only to the lines in Appendix A.

- **The fix path** (a link to the blocking Program, etc.) gets a new issue, per ADR 0126 Not chosen.
- **Player releases (`player-releases/actions.ts`)** is not moved. It is a server action that calls
  Core with `fetch`, not through `requestApi`/`ApiError`, and on purpose it shows Core's
  `Invalid input:` reason in English to platform administrators. Name it in the report.
- **Pages outside Media Workspace.**
- **Browser verification.** The main session asks the owner first (CLAUDE.md §3).

## Appendix — signed-off wording table (owner, 2026-11-25)

Phase A output, step 1b. The owner accepted every proposed line, and the recommendation in each flag of A.8 (option 1 for `unbound`). Phase B uses these lines exactly. The one exception is the generic `Invalid input:` line, which becomes "ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่" (ADR 0126 §8). In A.7 the **Thai** option is chosen for every row. The rows marked **Chosen** or signed off with a Q number (Q19–Q23) close the options Phase A left open. The unbound line is the one in A.1. A.8 #2–#5 take the proposals as written, and #4 keeps today's 404 text for `stale-draft`.

### A.1 Publish changes — `PublishChangesDialog.tsx:66` via `publish-changes-api.ts:39-52`

The dialog shows `Program “<name>” — <reason>`; the Program name stays separate, so the lines below are the reason only.

| Core message (inner) | Today | After |
|---|---|---|
| `composition is not active` | Layout ไม่ได้อยู่ในสถานะ Active | Layout ที่เลือกยังไม่ Active กรุณา Activate Layout ก่อนเผยแพร่ |
| `at least one target is required` | ยังไม่ได้เลือก Channel ปลายทาง | ยังไม่ได้เลือกปลายทาง กรุณาเลือกช่องทางหรือกลุ่มอย่างน้อย 1 รายการ |
| `the targets have no screens` | Channel หรือ Group ปลายทางยังไม่มีจอ | ช่องทางหรือกลุ่มที่เลือกยังไม่มีจอ กรุณาเพิ่มจอก่อนเผยแพร่ |
| `synchronized group target is incomplete — …` | Channel Group แบบ synchronized ยังไม่ครบ | กลุ่มซิงค์ที่เลือกมีช่องทางไม่ครบ (ขาด: …) กรุณาเพิ่มช่องทางที่ขาดให้ครบ |
| `cannot activate a direct device target inside a synchronized group — …` | Channel Group แบบ synchronized ยังไม่ครบ (same line, matched by bare `/synchronized/`) | จอ … อยู่ในกลุ่มซิงค์ จึงเลือกจอเดี่ยวไม่ได้ กรุณาเลือกทั้งกลุ่มหรือเอาจอนี้ออก |
| `zone(s) … are unbound` | เปิดใช้งานไม่ได้ — ยังไม่ได้ผูก Content ให้ Zone: X | **Layout ยังไม่ได้ผูก Content ให้ Zone: X กรุณาผูก Content ให้ครบทุก Zone** (signed off, Q19; same line in the Layout editor) |
| `remove or restore from Trash: …` / `file was deleted, replace it: …` | already `trashedAssetMessage` / `deletedFileMessage` | unchanged (same shared helpers) |
| `replace this file: …` / `wait — conversion in flight: …` | ไม่ผ่านเงื่อนไขการ Publish | ไฟล์ที่แปลงไม่สำเร็จ (…) กรุณาเปลี่ยนเป็นไฟล์อื่นก่อนเผยแพร่ / ไฟล์กำลังแปลง (…) กรุณารอให้เสร็จแล้วลองเผยแพร่อีกครั้ง |
| several file parts at once | only trashed OR deleted names shown (first match) | all parts joined with ` · ` (`fileRefusalMessage`) |
| `playlist % has no items`, `… produced zero resolvable snapshot items` | ไม่ผ่านเงื่อนไขการ Publish | ไม่มีเนื้อหาที่เล่นได้ใน Program นี้ กรุณาตรวจสอบว่า Playlist หรือ Layout มีสื่อที่ใช้งานได้ |
| `these channels are not active — activate them before publishing: X` | ไม่ผ่านเงื่อนไขการ Publish | ช่องทาง X ยังไม่เปิดใช้งาน กรุณาเปิดใช้งานช่องทางก่อนเผยแพร่ |
| `these channels were deleted — remove them from this Program: X` (develop only) | ไม่ผ่านเงื่อนไขการ Publish | ช่องทาง X ถูกลบแล้ว กรุณานำออกจาก Program นี้ก่อนเผยแพร่ |
| `[schedule] end time is in the past` | ไม่ผ่านเงื่อนไขการ Publish | Program นี้สิ้นสุดแล้ว ถ้าเผยแพร่ตอนนี้จะไม่ได้ออกอากาศเลย กรุณาเลื่อนวันสิ้นสุด หรือเอาวันสิ้นสุดออก |
| `publication has no layout/playlist`, `not found: composition not found` | ไม่ผ่านเงื่อนไขการ Publish | ยังไม่ได้เลือกเนื้อหา หรือเนื้อหาที่เลือกถูกลบไปแล้ว กรุณาเลือกเนื้อหาใหม่ |
| `not found: channel … not found` | ไม่ผ่านเงื่อนไขการ Publish | ไม่พบช่องทางหรือกลุ่มที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่ |
| `/quarantin/` | มีไฟล์ที่ถูกกักกัน… | rule deleted (dead) |
| inner with no rule (e.g. `publication is a draft — activate it instead…`) | ไม่ผ่านเงื่อนไขการ Publish | unchanged |
| **no wrapper**: 403 / 404 / network / any non-wrapped message | Publish ไม่สำเร็จ ยังไม่มีการเปลี่ยนแปลงกับ Program ใดเลย (every case, because the parser never looks at status) | **Changes.** `classifyApiError` runs its 403/404/transport/`Invalid input:` lines **before** the fallback, so these become บัญชีนี้ไม่มีสิทธิ์… / ไม่พบเนื้อหานี้… / เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ… / ข้อมูลที่กรอกยังไม่ครบ…. Only a 5xx or an unprefixed 4xx still shows today's line. **Chosen: accept** (Q15/Q23). The non-wrapped error shows the specific line. |

Notes: (a) the `publish-cause.ts` lines say "ช่องทาง/กลุ่ม" where the Channel-Groups screens say "Channel/Group"; ADR 0114 owns `publish-cause.ts`, so I did not touch them — owner may want a vocabulary pass later. (b) `names[0]` is the Program name; the wrapper regex today is unanchored `program "(.+)" — ` — a Program name containing `" — ` splits wrongly (greedy), existing behaviour.

### A.2 Program edit — `useProgramEdit.ts:95-111`, `PublicationEditPage.tsx:94-105, 229, 297`

Today: a `cause` shows Thai + fix button; a `[part]`-tagged message **without** a cause shows Core's raw English with only the tag removed (bound to that card); `Already modified:` shows the caller-owned English line at `PublicationEditPage.tsx:103` ("This Program was changed elsewhere. Reload…", not changed by this plan); anything else shows `classifyApiError`.

Tagged shapes (all from `media_publication_update_published`): `Invalid input: [part] rest` or `not found: [part] rest`; activate failures read `Invalid input: [publish] …`. Rows marked "UI-gated" are refusals the page's own validation should stop first (name, priority, type, picker constraints). I could not prove every one unreachable; for those the proposed "After" is the generic `Invalid input:` line.

| Part | Core message (after tag) | Today (raw English shown) | After |
|---|---|---|---|
| details | `name is required`; `publication_type must be …`; `priority must be …`; `not found: campaign not found for this tenant` | Invalid input: name is required … | UI-gated → ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่ |
| details/content/schedule | `only draft publications can be edited` | Invalid input: only draft publications can be edited | **NEW** Program นี้ไม่ใช่ Draft แล้ว จึงแก้ไขในหน้านี้ไม่ได้ กรุณาโหลดหน้านี้ใหม่ (same rule that carries `reason: "stale-draft"`) |
| content | `not found: composition not found for this tenant` | not found: composition not found for this tenant | ยังไม่ได้เลือกเนื้อหา หรือเนื้อหาที่เลือกถูกลบไปแล้ว กรุณาเลือกเนื้อหาใหม่ — **newly gains `cause: "no-content"`** (and its fix button), because the tag no longer sits between `not found: ` and the regex |
| content | `not found: playlist not found for this tenant` | raw | same line as above, **no cause** (Q21: not mapped; belongs to the fix-path issue) |
| content | `html and dynamic content cannot be edited here` | Invalid input: html and dynamic content cannot be edited here | **NEW** Program ประเภท HTML หรือ Dynamic แก้ไขเนื้อหาในหน้านี้ไม่ได้ |
| content | `at least one media asset is required` | raw | **NEW** ยังไม่ได้เลือกสื่อ กรุณาเลือกสื่ออย่างน้อย 1 รายการ |
| content | `items must be an array`; `playlist publications must reference …`; `composition publications carry …`; `a composition publication cannot also reference a playlist`; `only a composition publication may reference a composition`; `publication_type % does not take media assets`; `% item(s) reference a video not in this tenant`; `% item(s) are not of kind %`; `publication is linked to a playlist it does not own` | raw | UI-gated → generic `Invalid input:` line |
| targets | `not found: channel % not found for this tenant` / `channel group % not found …` | raw | ไม่พบช่องทางหรือกลุ่มที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่ — **newly gains `cause: "targets"`** (same tag reason) |
| targets | `not found: screen % not found for this tenant` | raw | **NEW** ไม่พบจอที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่ (no cause: `targets` regex does not match "screen") |
| targets | `duplicate target — the same channel, screen or group is listed twice` | raw | **NEW** เลือกปลายทางซ้ำกัน กรุณาเอารายการที่ซ้ำออก |
| targets | `targets must be an array`; `target_type must be channel, device or group` | raw | UI-gated → generic line |
| schedule | `end time is in the past — use End program instead` (`update_published`, B:10535) | Invalid input: end time is in the past — use End program instead (no cause: `classifyPublishCause` deliberately skips it, `publish-cause.ts:160`) | **NEW** วันสิ้นสุดผ่านไปแล้ว กรุณาใช้ End program แทนการแก้ไขวันสิ้นสุด. Must stay **without** `cause: "schedule-ended"`; the table needs this rule ahead of the plain `[schedule] end time is in the past` rule, or the guard is lost |
| schedule | the 17 `set_schedule` messages | Thai + cause today (patterns run on the raw text) | unchanged (`schedule-invalid`) |
| publish | `[publish]` + any activate message with a cause | Thai + cause today | unchanged |
| publish | `[publish] not found: composition not found …` | raw (`not found: [publish] composition…` does not match the regex) | same as the no-content line, **gains cause** |
| publish | `[publish] [schedule] end time is in the past` | already `schedule-ended` today | unchanged |
| any | `not found: publication not found for this tenant` (untagged, B:10513) | ไม่พบเนื้อหานี้ อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง | unchanged — the `stale-draft` rule must keep `kind: "not-found"` and this message, only add `reason`. Otherwise every screen that 404s on a Program changes wording |
| any | `Already modified: this program was changed elsewhere — reload…` | pageError English (caller-owned) | caller keeps it; `part`/`isStale` replaced by `kind === "conflict"` |

### A.3 Sync conflict — four screens, one line

Core messages: the five in B.1.3 (set_members ×2, groups_update, set_groups ×2 incl. `only one synchronized group`).

| Screen (file:line) | Today | After |
|---|---|---|
| `ManageChannelsModal.tsx:26` | Channel หนึ่งอยู่ใน Group แบบ Synchronized ได้เพียง Group เดียว กรุณานำออกจาก Group เดิมก่อน | same |
| `CreateEditGroupModal.tsx:69` | same as above | same |
| `UngroupedChannelsTable.tsx:35` | Channel นี้อยู่ใน Group แบบ Synchronized อื่นแล้ว (also shown for the dead duplicate-name arm) | Channel หนึ่งอยู่ใน Group แบบ Synchronized ได้เพียง Group เดียว กรุณานำออกจาก Group เดิมก่อน |
| `ChannelGroupsPickerModal.tsx:60` | A channel can only belong to one synchronized Group at a time. Remove it from the other Group first. | the Thai line above (or keep English; see A.7) |

Notes: `CreateEditGroupModal` also reaches `cannot make "%" synchronized, already synchronized elsewhere` when an operator flips an existing Group to synchronized; "นำออกจาก Group เดิมก่อน" fits slightly less well there. The Core texts carry Channel/Group names (`already synchronized in <Group>`); none of today's lines shows them and I did not add them. Today the Channels picker matches two phrases; after it matches all three (the third is never raised by `set_groups`, so nothing changes in practice).

### A.4 Template pages — `LayoutEditorPage.tsx:158`, `LayoutsListPage.tsx:114` vs Layout save (`useCompositionSave.ts:29`)

Today the Template pages send only `Invalid input:` messages to `layouts/describeSaveError`; `Already…` goes to `classifyApiError`. Layout save sends `Invalid input:` and `Already…` to `compositions/describeActivateError`.

| Core message | Template pages today | Layout save today | After (one line) |
|---|---|---|---|
| `zones % and % overlap` | บันทึกไม่ได้ — Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่ | บันทึกไม่ได้ — Zone ลำดับที่ N และ M ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่ | the numbered line |
| `Already exists: a layout named "%" exists` | ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่ (generic duplicate; the `Already exists` arm in the parser is dead) | บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น | มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น (drop "บันทึกไม่ได้ —": the same message also arises from Duplicate at `LayoutsListPage.tsx:133`) |
| `Already exists: a composition named "%" exists` | (not on these pages) | บันทึกไม่ได้ — มี Layout ชื่อนี้อยู่แล้ว | มี Layout ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น. Screens that call `classifyApiError` directly (`CompositionsListPage.tsx:129`, duplicate/restore dialogs) go from the generic line to this one |
| `Already exists: no free name for restored composition "%"` | generic duplicate line | generic duplicate line (via `Already`) | **NEW** กู้คืน Layout ไม่ได้ เพราะไม่มีชื่อว่าง กรุณาเปลี่ยนชื่อ Layout ที่ชื่อซ้ำก่อน. Flag: this is not a name-the-user-typed collision, so it should not share the `duplicate-name` line |
| `a layout needs at least one zone` | บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone | บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง | บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone |
| `zone is used by composition(s) %` | บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง | ลบ Zone ไม่ได้ — Template นี้ยังถูกใช้ใน: X | ลบ Zone ไม่ได้ — Template นี้ยังถูกใช้ใน: X (Template pages **gain** it; this is where it actually occurs) |
| `Already modified: composition was changed elsewhere` | generic conflict line | Layout นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง | Layout นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง (the other `Already modified:` texts keep the generic line: ข้อมูลถูกแก้ไขจากที่อื่นระหว่างที่คุณทำงานอยู่ กรุณาโหลดหน้านี้ใหม่ก่อนบันทึกอีกครั้ง) |
| `playlist is in Trash: %`, `cannot change the layout of an active composition`, `cannot move a composition back to draft` | not on Template pages | existing lines | unchanged text; screens that used classify directly gain them |
| `cannot leave an active composition incomplete — zone(s) % are unbound` | (n/a) | เปิดใช้งานไม่ได้ — ยังไม่ได้ผูก Content ให้ Zone: X (wrong verb: this is a save on an already-active Layout) | see A.8 |
| any other `Invalid input:` (zod, `zone % is out of bounds`, `must have positive width and height`, colour, resolution) | บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (parser fixed fallback) | same | **Changes.** The generic `Invalid input:` line runs before the caller `fallback`, so it becomes ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่. **Chosen: accept** (Q20). No new rules. |

### A.5 Parser fallbacks (do they keep showing?)

| Fallback string (today, file) | Reached today by | After the plan | Keeps showing? |
|---|---|---|---|
| บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (`layouts/status-display.ts:29`) | `Invalid input:` messages with no specific match, on `LayoutEditorPage` and **every** `LayoutsListPage` action (restore, duplicate, archive — wrong verb there) | generic `Invalid input:` line; for non-`Invalid input:` errors the caller's own fallback (`บันทึก Layout ไม่สำเร็จ`, `กู้คืน Layout ไม่สำเร็จ`, `คัดลอก Layout ไม่สำเร็จ`, `เก็บ Layout ไม่สำเร็จ`) which already showed today | **No** for `Invalid input:`; yes otherwise. Archive/restore/duplicate failures improve (right verb) when not `Invalid input:` |
| บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (`compositions/status-display.ts:63`) | in `useCompositionSave`: `Invalid input:` and **any** `Already…` with no match. Caller fallbacks are `บันทึก Layout ไม่สำเร็จ` and `เปิดใช้งาน Layout ไม่สำเร็จ` (`CompositionEditorPage.tsx:203,211-217,292-296`), plus `run()` at 228/244 | `Invalid input:` → generic line; unmatched `Already…` (e.g. `Already in use:`, `Already active:`) → caller fallback (so an activate failure now says เปิดใช้งาน Layout ไม่สำเร็จ instead of บันทึก…) | **No**, as above |
| ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (`playlists/status-display.ts:63`) | **every** error of Move to Trash, incl. 403/404/network (`PlaylistsListDialogs.tsx:54` passes only `err.message`) | `classifyApiError(err, same string)`: 403 → บัญชีนี้ไม่มีสิทธิ์…; 404 → ไม่พบเนื้อหานี้…; network → เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ…; unmatched `Invalid input:` → generic; 5xx / unprefixed 4xx → this line | **Only for 5xx / unprefixed 4xx** |
| Publish ไม่สำเร็จ ยังไม่มีการเปลี่ยนแปลงกับ Program ใดเลย (`publish-changes-api.ts:41`) | every non-wrapped error | see A.1 | **No** for 403/404/network/`Invalid input:` |
| ไม่ผ่านเงื่อนไขการ Publish (`publish-changes-api.ts:51`) | wrapped inner with no rule | same | Yes |
| usePlaylistEditorRow fallback "มีการแก้ไข Playlist นี้จากที่อื่นหลังจากคุณเปิดหน้านี้ — กด โหลดใหม่…" (`usePlaylistEditorRow.ts:124`) | never — `Already modified:` returns the generic conflict line, so this fallback string is already dead (caller-owned, not Core text) | unchanged | n/a (info) |

### A.6 Playlist trash — `PlaylistsListDialogs.tsx:54` (`action === "trash"` only; other actions already use `classifyApiError`)

| Core message | Today | After |
|---|---|---|
| `playlist is used by an active or draft publication: A, B` | ย้ายลงถังไม่ได้ — playlist นี้ถูกใช้อยู่ใน publication ที่ active หรือ draft: A, B กรุณายกเลิก publication เหล่านั้นก่อน | **ย้ายลงถังไม่ได้ — Playlist นี้ถูกใช้อยู่ใน Program ที่ Active หรือ Draft: A, B กรุณายกเลิก Program เหล่านั้นก่อน** (Q22, CONTEXT.md "Program"; not required) |
| `this playlist belongs to a publication and cannot be deleted on its own` | ลบไม่ได้ — playlist นี้ถูกสร้างโดย publication ให้ลบที่ publication แทน | **ลบไม่ได้ — Playlist นี้ถูกสร้างโดย Program ให้ลบที่ Program แทน** (Q22) |
| `Already in use: …` | two video lines | **deleted, dead** (see B.2.2) |
| 403 / 404 / network | ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง | see A.5 |

Because the table is entity-agnostic, the first two lines now also show on any other screen that receives them (only `media_playlist_delete` raises them).

### A.7 Channels — Thai chosen

**Refusal lines.** Option "Thai" = the rule's `message` is shown. Option "unchanged" = the caller keeps its English constant, chosen by `reason`/`kind` (the table message is Thai either way, so this means the caller ignores it).

| Screen (file:line) | Core message | Today (English) | Option A: Thai (recommended: matches #456 and the Group screens) | Option B |
|---|---|---|---|---|
| `CreateChannelModal.tsx:134`, `ChannelEditorPage.tsx:95` | `Already exists: a channel named % already exists` | A Channel with this name already exists. | มี Channel ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น | unchanged |
| `CreateChannelModal.tsx:137`, `ChannelEditorPage.tsx:99` | `… different orientation … confirm to continue: %` / `… different resolution … confirm to continue: %` | The Player display information changed. Refresh the Player list, review the warning, and confirm again. | ข้อมูลการแสดงผลของ Player เปลี่ยนไป กรุณารีเฟรชรายการ Player ตรวจสอบคำเตือน แล้วยืนยันอีกครั้ง | unchanged |
| `ChannelEditorPage.tsx:97` | `Already in use: cannot remove % while these publications target this channel: %` | Can't change the Player — an active or scheduled Publication still targets this Channel. | เปลี่ยน Player ไม่ได้ เพราะยังมี Program ที่ Active หรือกำหนดเวลาไว้ใช้ Channel นี้อยู่ ("Publication" in today's English is off-vocabulary) | unchanged |
| `DeleteChannelDialog.tsx:69` via `delete-refusal.ts:15` | `Invalid input: remove this channel from its groups before deleting: G1, G2` | Remove this Channel from its groups first: G1, G2. | ลบ Channel นี้ไม่ได้ — ยังอยู่ใน Group: G1, G2 กรุณานำออกจาก Group ก่อน | unchanged |
| same, `:18` | `Already in use: these publications still target this channel: P1, P2` | These Programs still target this Channel: P1, P2. | ยังมี Program ใช้ Channel นี้อยู่: P1, P2 กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อน (**no "ลบไม่ได้" / "ปิดใช้งานไม่ได้"**: see A.8, this Core text is shared with deactivate) | unchanged |
| same, `:21` | `Already in use: this channel has Program or playback history and cannot be deleted yet` (main only) | This Channel has Program or playback history and can't be deleted yet. Deactivate it instead. | ลบ Channel นี้ไม่ได้ เพราะมีประวัติ Program หรือการเล่นอยู่ กรุณาปิดใช้งานแทน | unchanged |
| `ChannelGroupsPickerModal.tsx:60` | sync conflict | A channel can only belong to one synchronized Group at a time. Remove it from the other Group first. | the A.3 Thai line | unchanged |

**Caller English `fallback` strings** (not Core text; the ADR leaves them out of §8 until the owner decides):

| Where | Today | Thai option |
|---|---|---|
| `ChannelLifecycleActions.tsx:54` | Could not activate this Channel. Try again. | เปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelLifecycleActions.tsx:69` | Could not deactivate this Channel. Try again. | ปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelRowActionsMenu.tsx:49` | Could not disable this Channel. Try again. | ปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelEditorPage.tsx:55` | Could not load this Channel. Try again. | โหลด Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelEditorPage.tsx:103` | Could not save Channel changes. Try again. | บันทึกการเปลี่ยนแปลง Channel ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelsListPage.tsx:93`, `:115` | Could not load Channels. Try again. | โหลดรายการ Channel ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelGroupsPickerModal.tsx:32` | Could not load Channel Groups. | โหลด Channel Group ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelGroupsPickerModal.tsx:63` | Could not update this channel's Groups. Try again. | อัปเดต Group ของ Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |
| `CreateChannelModal.tsx:141` | Could not create Channel. Try again. | สร้าง Channel ไม่สำเร็จ กรุณาลองใหม่ |
| `DeleteChannelDialog.tsx:69` | Could not delete this Channel. Try again. | ลบ Channel นี้ไม่สำเร็จ กรุณาลองใหม่ |

Recommendation: do refusal lines and fallbacks together (Thai), because after the change every other message on those screens is already Thai (generic 403/404/transport lines), so English fallbacks would sit beside Thai lines on one screen.

Related changes on Channels screens (not in the plan's list):
- `ChannelLifecycleActions.tsx:54` shows `error.message` for `kind: "already-active"`, which today is Core's raw `Already active: channel is already active`. A table row for `already-active` needs a Thai message, **NEW**: Channel นี้เปิดใช้งานอยู่แล้ว กรุณาโหลดหน้านี้ใหม่. Same for `Already active: publication is not a draft` where a screen shows it (only `usePublishDraft.ts:390` consumes the kind, and it ignores the text): **NEW** Program นี้ไม่ได้อยู่ในสถานะ Draft แล้ว กรุณาโหลดหน้านี้ใหม่.
- Deactivate (`ChannelLifecycleActions.tsx:69`, `ChannelRowActionsMenu.tsx:49`) currently shows the caller fallback for `Already in use: these publications still target this channel: …`; after, it shows the program-list line above (more specific, intended side effect).
- `ChannelGroupInspector.tsx:54` (update Group) and `ChannelGroupsPage` for `Already exists: a channel group named …`: today the generic ชื่อนี้ถูกใช้ไปแล้ว…; after มี Channel Group ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น (today's `CreateEditGroupModal.tsx:68` line is มี Channel Group ชื่อนี้อยู่แล้ว).

### A.8 Screens that may need their own wording (flag, no new `reason`)

1. **`zone(s) … are unbound` (stop-condition 2).** `Invalid input: cannot activate an incomplete composition — zone(s) % are unbound` is raised by both `media_publication_activate` (publish) and `media_composition_set_status` (activating a Layout in the editor), same text. Today: publish screens show the `publish-cause.ts` line (… Activate Layout ก่อนเผยแพร่) and the Layout editor shows เปิดใช้งานไม่ได้ — ยังไม่ได้ผูก Content ให้ Zone: X. A context-free table can give only one; the publish line would tell an operator who is already activating the Layout to "Activate Layout". Options: (1) one neutral line for both, e.g. Layout ยังไม่ได้ผูก Content ให้ Zone: X กรุณาผูก Content ให้ครบทุก Zone ก่อนเปิดใช้งานหรือเผยแพร่ — requires changing the line in `publish-cause.ts` (ADR 0114 owner; its checks pin it); (2) keep the editor's line in `useCompositionSave` keyed on `cause === "zones-unbound"` (caller-owned wording; Zone names would have to be re-read by the caller, which breaks "never reads message"). Recommend (1). The set_zones variant (`cannot leave an active composition incomplete`) is a different text and should keep its own line (it is a save, not an activation): proposed **NEW** บันทึกไม่ได้ — Layout ที่ Active อยู่ต้องผูก Content ให้ครบทุก Zone ยังไม่ได้ผูก: X.
2. **`Already in use: these publications still target this channel:`** is raised by `media_channel_delete` and `media_channel_deactivate`. Resolved by a verb-free line (A.7); owner should confirm that is acceptable.
3. **`Already modified:`** has five different Core texts naming draft / composition / channel / program / delivery attempt. Proposed: composition keeps the Layout line, the rest share the generic line. Owner may prefer one line for all.
4. **`not found: publication not found for this tenant`** is raised by ~13 RPCs; the `stale-draft` rule must keep today's 404 text and only add `reason`, otherwise Program page 404s change wording (A.2).
5. **Verb in shared name-collision lines.** I dropped "บันทึกไม่ได้ —" from the Template/Layout name lines because duplicate and restore raise the same message; that does change today's Layout-save line.
6. **People** (`AddEmployee/Contractor/BulkWizardPage`): none branches on `kind === "retryable"`. They keep the generic lines. Core's non-media routes raise no `Already exists:` text (`git grep` of `src`), so the removal of the catch-all `isDuplicateName` text has no People effect I can find.

---

## Appendix B — fixture inventory (Phase A, step 1)

`B` = `20261026235959_baseline_from_prod.sql` (both refs). Lines are for the file named; "main file / develop file" given when the latest definition differs per ref.

### B.1.1 `src/lib/api/api-error.ts`

| Frontend match | Live Core message (exact) | RPC / route | Migration file (line) | Live on |
|---|---|---|---|---|
| `isAlreadyActive` :58 | `Already active: publication is not a draft` | `media_publication_activate` | main `20261113075848_native_canvas_size.sql`:85; develop `20261122090652_channel_tombstone_guards.sql`:268 | both |
| same | `Already active: channel is already active` | `media_channel_activate` | B:4907 | both |
| `isConflict` :70 | `Already modified: draft was changed elsewhere` | `media_publication_upsert`, `media_playlist_upsert` | upsert main B:10788 / develop `20261122191715_draft_patch_keeps_omitted_fields.sql`:151; playlist B:8789 | both |
| same | `Already modified: composition was changed elsewhere` | `media_composition_upsert`, `media_composition_set_zones`, `media_composition_fork_layout` | B:6020 (upsert); `20261120150000_what_holds_a_playlist.sql`:96 (set_zones); `20261117035953_layout_copies_keep_canvas_mode.sql` (fork) | both |
| same | `Already modified: channel was changed elsewhere` | `media_core.channel_lock` (every channel write) | main B:616/661; develop `20261122090652_channel_tombstone_guards.sql`:57 | both |
| same | `Already modified: this program was changed elsewhere — reload to see the latest` | `media_publication_update_published` | B:10517 | both |
| same | `Already modified: stale delivery attempt` | `media_publication_download_report` (Player route, not an operator screen) | B:9595 | both |
| `isDuplicateName` :80 | `Already exists: a channel named % already exists` | `media_channel_create`, `media_channel_update` | B; `20261121100502_channel_delete_unused.sql`:131 (update) | both |
| same | `Already exists: a channel group named % already exists` | `media_channel_groups_create`, `_update` | B | both |
| same | `Already exists: a composition named "%" exists` | `media_composition_upsert`, `media_composition_duplicate` | B; `20261117035953_...sql` (duplicate) | both |
| same | `Already exists: a layout named "%" exists` | `media_layout_upsert` | B:7468, 7482 | both |
| same | `Already exists: no free name for restored composition "%"` | `media_composition_restore` | B:5853 | both |
| `isUnapprovedAsset` :90 | `media asset(s) are not approved` | none | no raise anywhere | **dead, both** |

Not raised by anything: `Already exists:` from `media_channel_groups_set_members` (see B.2.2).

### B.1.2 `publish-cause.ts` (stays; table only calls it). Liveness for the fixtures the table will carry

| Match | Live message | RPC | File | Live on |
|---|---|---|---|---|
| `[schedule] end time is in the past` (no "use End program") | `Invalid input: [schedule] end time is in the past` | `media_publication_activate` | main `20261113075848`; develop `20261122090652` | both |
| same + guard `use End program` | `Invalid input: [schedule] end time is in the past — use End program instead` | `media_publication_update_published` | B:10535 | both |
| schedule-invalid list | `starts_at is required`, `ends_at must be after starts_at`, `daily_start must be before daily_end`, `recurrence requires daily_start and daily_end`, `unknown timezone %`, `recurrence.*`, `monthly recurrence uses month_days, not days`, `dates recurrence uses dates, not days or month_days` | `media_publication_set_schedule` (+ `media_schedule_conflicts` for `starts_at is required`) | `20261111170000_daily_end_2359_through_midnight.sql` | both |
| no-content | `Invalid input: publication has no layout — add one before activating`, `publication has no playlist — add content before activating`, `not found: composition not found for this tenant` | `media_publication_activate` (+ upsert for the not-found) | as above | both |
| layout-not-active | `Invalid input: composition is not active — activate it before publishing` | activate (native_canvas_size:113) | as above | both |
| zones-unbound | `Invalid input: cannot activate an incomplete composition — zone(s) % are unbound` | `media_publication_activate` (:145), **also** `media_composition_set_status` (B) | both | both |
| nothing-playable | `playlist % has no items — add content before activating`; `composition % / playlist % produced zero resolvable snapshot items` | activate | as above | both |
| targets | `synchronized group target is incomplete — %`; `cannot activate a direct device target inside a synchronized group — %`; `at least one target is required`; `not found: channel not found: %` / `channel % not found for this tenant` / `channel group …` | activate / upsert / `media_channel_groups_*` | as above | both |
| **direct-target publication on … — synchronized playback is enabled** | — | none | no raise | **dead, both** |
| channels-deleted | `Invalid input: these channels were deleted — remove them from this Program: %` | `media_publication_activate` | develop `20261122090652_channel_tombstone_guards.sql`:374 only | **develop only** |
| channels-inactive | `these channels are not active — activate them before publishing: %` | activate | as above | both |
| inactiveChannelMessage others | `only active channels can join a group — not active: %`; `— activate this channel first`; `remove this channel from its groups before deactivating: %` | `media_channel_groups_set_members`, `media_channel_set_groups`, `media_channel_deactivate` | B / develop `20261122090652` | both |
| no-screens | `the targets have no screens — add a screen to the channel or group before publishing` | activate | as above | both |
| files | `cannot activate — %` with parts `replace this file: %`, `wait — conversion in flight: %`, `remove or restore from Trash: %`, `file was deleted, replace it: %` (joined by `; `) | activate | as above | both |

Comment in `publish-cause.ts` says `cannot activate — equal-priority overlap …`; no such raise exists (the only `equal-priority` hit is `media_job_poll`). Not a dead branch (the code only reads the four file parts), only a stale comment.

### B.1.3 Step 4 feature parsers

| Frontend match (file:line) | Live Core message (exact) | RPC / route | Migration file (line) | Live on |
|---|---|---|---|---|
| `channel-groups-api.ts:111` `already synchronized elsewhere` | `Invalid input: cannot add to synchronized group "%", already synchronized elsewhere: %` | `media_channel_groups_set_members` | main B:5267; develop `20261122090652_channel_tombstone_guards.sql`:703 | both |
| same | `Invalid input: cannot make "%" synchronized, already synchronized elsewhere: %` | `media_channel_groups_update` | B:5339 | both |
| `channel-groups-api.ts:112`, `channels-api.ts:443` `already in another synchronized group` | `Invalid input: a channel in this selection is already in another synchronized group` | `media_channel_groups_set_members` | main B:5281; develop …guards:717 | both |
| same | `Invalid input: this channel is already in another synchronized group` | `media_channel_set_groups` | main B:5480; develop …guards:787 | both |
| `channel-groups-api.ts:113`, `channels-api.ts:443` `only one synchronized group` | `Invalid input: a channel may belong to only one synchronized group, selected: %` | `media_channel_set_groups` | main B:5467; develop …guards:774 | both |
| `channel-groups-api.ts:117-123` `groupInUseNames` | `Already in use: remove this group from these publications first: %` | `media_channel_groups_delete` | B:5175 | both |
| `delete-refusal.ts:3` | `Invalid input: remove this channel from its groups before deleting: %` (names joined `, `) | `media_channel_delete` | main `20261121100502_channel_delete_unused.sql`:178; develop `20261125080525_channel_tombstone.sql`:36 | both |
| `delete-refusal.ts:4` | `Already in use: these publications still target this channel: %` | `media_channel_delete` (**and** `media_channel_deactivate`, B:5034) | main …delete_unused:183; develop …channel_tombstone:41 | both |
| `delete-refusal.ts:5` | `Already in use: this channel has Program or playback history and cannot be deleted yet` | `media_channel_delete` | main `20261121100502`:190 | **main only** (known; keep rule) |
| `ChannelEditorPage.tsx:25` `cannot remove` + `target this channel` | `Already in use: cannot remove % while these publications target this channel: %` | `media_core.channel_set_devices` (via `media_channel_update`, `_create`) | B:790 | both |
| `ChannelEditorPage.tsx:98`, `CreateChannelModal.tsx:136` `confirm to continue` | `Invalid input: this player reports a different orientation than the channel expects, confirm to continue: %` and `Invalid input: these devices report a different resolution than the channel expects, confirm to continue: %` | `media_core.channel_validate` (via create/update) | B:895, 907 | both |
| `playlists/status-display.ts:34` `used by an active or draft publication: ` | `Invalid input: playlist is used by an active or draft publication: %` | `media_playlist_delete` | `20261120100000_playlist_in_use_via_layout.sql`:266 | both |
| `playlists/status-display.ts:39` `used by (\d+) publication` | — | none | no raise | **dead, both** |
| `playlists/status-display.ts:43` `belongs to a publication` | `Invalid input: this playlist belongs to a publication and cannot be deleted on its own` | `media_playlist_delete` | `20261120100000`:253 | both |
| `playlists/status-display.ts:48-55` `Already in use:` (+ `referenced by a playlist`) | — | `media_video_delete` was **dropped**: `DROP FUNCTION IF EXISTS public.media_video_delete(uuid, uuid)` | `20261104050001_media_asset_tombstone.sql`:32 | **dead, both (not on the ADR list; see B.2.2)** |
| `compositions/status-display.ts:28` `a layout named` | `Already exists: a layout named "%" exists` | `media_layout_upsert` | B:7468, 7482 | both |
| `compositions/status-display.ts:33` `zones (\d+) and (\d+) overlap` | `Invalid input: zones % and % overlap` | `media_layout_upsert` | B:7455 | both |
| `compositions/status-display.ts:35` `Already exists` | the composition / layout / restore texts in B.1.1 | see B.1.1 | | both |
| `compositions/status-display.ts:35` `duplicate key\|unique constraint` | — | unreachable (`callMedia` strips unprefixed text; only SQL/route *comments* contain the words) | | **dead, both** |
| `compositions/status-display.ts:38` `Already modified` | `Already modified: composition was changed elsewhere` | see B.1.1 | | both |
| `compositions/status-display.ts:42` `zone is used by composition(s) ` | `Invalid input: zone is used by composition(s) %` | `media_layout_upsert` | B:7513 | both |
| `compositions/status-display.ts:45` `playlist is in Trash: ` | `Invalid input: playlist is in Trash: %` | `media_composition_set_zones` | `20261120150000`:136 | both |
| `compositions/status-display.ts:47` | `Invalid input: cannot change the layout of an active composition` | `media_composition_upsert` | B:6184 | both |
| `compositions/status-display.ts:56-57` `zone(s) … are unbound` | `Invalid input: cannot activate an incomplete composition — zone(s) % are unbound` (set_status B, activate); `Invalid input: cannot leave an active composition incomplete — zone(s) % are unbound` (set_zones) | `media_composition_set_status`, `media_publication_activate`, `media_composition_set_zones` | B; `20261113075848`; `20261120150000` | both |
| `compositions/status-display.ts:59` | `Invalid input: cannot move a composition back to draft` | `media_composition_set_status` | B:5892 | both |
| `layouts/status-display.ts:16` `more than 4 zones` | — | none (cap removed) | | **dead, both** |
| `layouts/status-display.ts:19` | `Invalid input: a layout needs at least one zone` | `media_layout_upsert` | B:7408 | both |
| `layouts/status-display.ts:22` `overlap` | `Invalid input: zones % and % overlap` | `media_layout_upsert` | B:7455 | both |
| `layouts/status-display.ts:25` `Already exists` branch | — | unreachable: both callers gate on `startsWith("Invalid input:")` (`LayoutEditorPage.tsx:158`, `LayoutsListPage.tsx:114`) | | **dead, both** |
| `publish-changes-api.ts:30` `composition is not active` | see B.1.2 layout-not-active | activate, via republish | | both |
| `:31` `at least one target` | `Invalid input: at least one target is required` | activate | | both |
| `:32` `targets have no screens` | see B.1.2 no-screens | activate | | both |
| `:33` `quarantin` | — | none (only the text of `20261028150500_help_seed.sql`) | | **dead, both** |
| `:34` `synchronized` (bare) | the two activate texts `synchronized group target is incomplete — %` and `cannot activate a direct device target inside a synchronized group — %` | activate | | both |
| `:40` wrapper `program "(.+)" — (.*)` | `Invalid input: program "%" — %` (inner = SQLERRM of `media_publication_republish`, so the inner **keeps its own prefix**, e.g. `program "X" — Invalid input: composition is not active …`) | `media_core.publish_changes_apply` | B:1809 | both |
| `usePublishDraft.ts:36-42` `publication not found for this tenant` | `not found: publication not found for this tenant` | ~13 RPCs (activate, cancel, delete, duplicate, get, republish, set_content, set_schedule, upsert, update_published …) | B / `20261113060000` / `20261111170000` / develop `…draft_patch…` | both |
| same `only draft publications can be edited` | `Invalid input: only draft publications can be edited` | `media_publication_upsert` (B:10753, 10784), `_set_content`, `_set_schedule` | | both |
| `program-edit.ts:180` `PART_TAG` | tag is written by `media_core.publication_error_tag` as `Invalid input: [part] rest` / `not found: [part] rest` (tag after the prefix; activate adds `[publish]` in front of an inner `[schedule]`) | `media_publication_update_published` (B:10573-10617) | B | both |
| `program-edit.ts:183` `startsWith("Already modified:")` | `Already modified: this program was changed elsewhere — reload to see the latest` | `media_publication_update_published` | B:10517 | both |
| `ChannelGroupsPickerModal` / `UngroupedChannelsTable` `isDuplicateName` arm | — | `media_channel_groups_set_members` raises no `Already exists:` | | **dead, both (B.2.2)** |

---

### B.2 Dead and one-branch-only texts

### B.2.1 ADR / plan list — all confirmed on both `main` and `develop`

| Branch to delete | Result |
|---|---|
| `isUnapprovedAsset` (`media asset(s) are not approved`) | no raise on either ref (also no hit in `src/app/api/core/v1/media`) |
| `direct-target publication on` (`publish-cause.ts:57`) | no hit on either ref |
| `more than 4 zones` | no hit on either ref |
| `used by (\d+) publication` | no hit on either ref |
| `quarantin` in `REASONS` | one hit, in the help seed text only (`20261028150500_help_seed.sql`), not a raise |
| `duplicate key\|unique constraint` | no raise; only code comments (`player-releases/route.ts:45`, `20261106104344_…hierarchy.sql:95`) |
| `Already exists` branch of `layouts/status-display.ts` | unreachable by the two callers' `startsWith("Invalid input:")` gate; Core does raise `Already exists: a layout named` but it never reaches this function |
| channel delete `… Program or playback history …` | live on **main only**; absent on develop (`20261125080525_channel_tombstone.sql` raises only groups + programs). Keep rule. |

### B.2.2 Found beyond the list

1. **`playlists/status-display.ts:46-55` — the whole `Already in use:` branch is dead on both** (both sub-lines: "วิดีโอนี้ยังถูกใช้อยู่ใน playlist…" and "วิดีโอนี้เคย publish ไปแล้ว…"). Its only source was `media_video_delete`, dropped in `20261104050001_media_asset_tombstone.sql`:32. `media_playlist_delete` (the only RPC behind "Move to Trash") raises no `Already in use:`. Plan step 4 says to move this into rules; it should be deleted instead. **This is a stop-condition-3 hit (an expected-live text has no live source); the decision to delete is the owner's.**
2. **`UngroupedChannelsTable.tsx:35` `isDuplicateName(...)` arm is dead.** `setChannelGroupMembers` → `media_channel_groups_set_members` has no `Already exists:` raise (live raises: not found ×2, `only active channels can join a group`, `already synchronized elsewhere`, `already in another synchronized group`). Only `isSyncConflict` can fire.
3. **One-branch-only (develop): `these channels were deleted — remove them from this Program: %`** (`deletedChannelMessage`, ADR 0122 rule 16), raised only by `media_publication_activate` in `20261122090652_channel_tombstone_guards.sql`:374. Not in the ADR. Keep, fixture names develop.
4. `isAlreadyActive` today is a lower-case `includes("already active")`; only the `Already active:` prefix is raised on either ref, so `startsWith("Already active:")` loses nothing.
5. Live Core texts that no rule reads today and that will keep falling to the generic line (info only): `media_channel_update` `Invalid input: a channel that has been created cannot be returned to draft` / `an active channel needs a player` (`20261121100502`:96/101); `media_layout_upsert` `zone % must have positive width and height` (B:7436), `zone % is out of bounds` (B:7442), `background must be a 6-digit hex colour`, `reference_resolution must look like 1920x1080`; `media_layout_set_kind` `cannot make a Layout private while it is used by % Composition(s)`; `media_publication_republish` `publication is a draft — activate it instead of re-publishing` / `only an active publication can be re-published`.

---
