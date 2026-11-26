# Plan — keep raw Core error text off the screen (#456)

Issue: https://github.com/rdThunderThailand/thunder_one_prj/issues/456 (tracking #464; related #460).
Base: `dev` @ 522e4511. Branch: `fix/456-raw-api-errors`. Risk: R1 (cross-file, reversible, no backend change).
Reviewed by scrutinizer 2026-11-25 (fix-then-ship); this version folds its findings in.

Rule being enforced: raw error text from the backend/DB must not reach the UI. Text the frontend
writes for the user on purpose must keep reaching it.

## Decisions (owner, 2026-11-25)

1. Unmatched errors show the caller's `fallback`, not `err.message`.
2. Channel Groups: fix the raw leaks, and translate that folder's error messages to Thai (step 5b).
   Labels and headings stay as they are.
3. `console.error` the raw error only where `classifyApiError` falls back.
4. Every direct `<x> instanceof Error ? <x>.message` display site in `src/features/media-workspace`
   moves to `classifyApiError` in this PR.
5. Frontend-authored user text is marked with a `UserFacingError` class, which `classifyApiError`
   passes through unchanged.

## Steps

### 1. `src/lib/api/api-error.ts`

Add, next to `ApiError`:

```ts
/** Text written by the frontend for the user; `classifyApiError` shows it as-is. */
export class UserFacingError extends Error {}
```

In `classifyApiError`:

- First line: `if (err instanceof UserFacingError) return { kind: "rejected", message: err.message };`
- The three branches that return the raw `message` today — non-`ApiError` non-transport
  (`retryable`), other 4xx (`rejected`), 5xx/else (`retryable`) — return `fallback` instead, after
  `console.error(err)`. Kinds unchanged.

Not changed: `already-active` keeps the raw message (sole caller `usePublishDraft.ts:390` reads `kind`
only). Note for the PR, not fixed here: the comment above the non-`ApiError` branch argues against
"retryable" but the branch returns `retryable`.

### 2. Mark the frontend's own user text

- `publications/draft-save-policy.ts:8`: `class DraftSaveError extends UserFacingError {}` (covers its
  9 throw sites, incl. the ADR 0086 §10 stale-draft text at `usePublishDraft.ts:267`).
  `useCreateDraftEntry.ts:147-165` checks `error instanceof DraftSaveError ? classified.message : …` —
  still correct after the change; leave it.
- Change `new Error(` → `new UserFacingError(` at:
  - `publications/hooks/usePublishDraft.ts:240`
  - `publications/hooks/useCreateDraftEntry.ts:89`
  - `publications/services/tus-upload.ts:22` and `:103`
  - `preview/FullPreviewPage.tsx:119`, `:126`

  (found with `grep -rnE 'new Error\([^)]*[ก-๙]' src`; `features/auth/login-error.ts` is out of scope.)

### 3. `src/lib/api/api-error.check.mts`

- Line 119: change input to `new UserFacingError("อะไรบางอย่างพัง")` (still expects the text back).
- Add: `new Error("x")` and `new TypeError("x")` → `FALLBACK`.
- Line 156: `new ApiError("HTTP Error 500", 500)` → expect `FALLBACK`.
- Add: unmatched 4xx `new ApiError("Some Core text", 422)` → `FALLBACK`, kind `rejected`.
- Expect `console.error` noise on stderr when running it; acceptable.

Run: `node src/lib/api/api-error.check.mts`.

### 4. Direct sites → `classifyApiError(<x>, <existing fallback>).message`

Exact list (`grep -rnE "\w+ instanceof Error \? \w+\.message" src/features/media-workspace`, 27 hits):

```
playlists/components/usePlaylistEditorRow.ts:121
playlists/components/PlaylistsListDialogs.tsx:53
compositions/hooks/useCompositionSave.ts:28
publications/components/PublicationsListPage.tsx:162
publications/components/PublicationDetailPage.tsx:88,112,124,140
publications/components/GroupsStep.tsx:26
publications/components/CreatePublicationPage.tsx:222,240
publications/components/LayoutZonePlayModeControl.tsx:62
publications/hooks/usePublishDraft.ts:37,119,205
publications/hooks/useDeliveryProgress.ts:51
publications/hooks/useProgramEdit.ts:95        (special case, below)
publish-changes/PublishChangesDialog.tsx:66
player-releases/new-release-dialog.tsx:89,108
layouts/components/LayoutEditorPage.tsx:157
layouts/components/LayoutsListPage.tsx:113
assets/useAssetUpload.ts:42
assets/media-library-page.tsx:111,162
assets/upload/useUploadQueue.ts:118
channels/delete-refusal.ts:13                   (skip, below)
```

Rules:
- Keep each site's current fallback string. Skip a hit whose message is not displayed (predicate or
  parser input) — read the line first.
- `channels/delete-refusal.ts:13`: skip; it parses a known refusal on purpose.
- `useProgramEdit.ts:95-107`: it passes `parsed.message` (Core text) as the fallback, so it would
  still leak. Pass a fixed Thai fallback instead, e.g. `"บันทึก Program ไม่สำเร็จ กรุณาลองใหม่"`, and keep
  `parsed` only for the `part` / `isStale` branches.
- `usePublishDraft.ts:277` `classifyApiError(err, err.message)` is safe (runs only after `isConflict`);
  leave it.
- Fallback wording: change `"Failed to publish publication."` (`usePublishDraft.ts:387`) to the UI term
  ("Program", per #458), e.g. `"เผยแพร่ Program ไม่สำเร็จ กรุณาลองใหม่"`. Other English fallbacks stay as
  they are (no copy sweep in this PR).

### 5. Channel Groups (`channel-groups/`)

- `components/ManageChannelsModal.tsx:29`: delete the `isDuplicateName → return caught.message`
  branch. `media_channel_groups_set_members` never raises `Already exists:` (Core baseline
  `20261026235959_baseline_from_prod.sql:5218-5289`), so it is dead and only leaks if it ever fires.
- `components/ChannelGroupInspector.tsx:69-70`: Core raises
  `Already in use: remove this group from these publications first: <names>` (baseline `:5175`).
  Follow `channels/delete-refusal.ts`: strip the prefix, keep the names, show the screen's own line,
  e.g. `These Programs still use this Group: <names>.` Add an assert to
  `services/channel-groups-api-contract.check.mts` for the parse.
- `services/channel-groups-api.ts:105-108`: the comment says sync-conflict text "is shown as-is"; all
  three callers (`ManageChannelsModal.tsx:26`, `UngroupedChannelsTable.tsx:35`,
  `CreateEditGroupModal.tsx:69`) show their own line. Rewrite the comment to say what the predicate is for.

### 5b. Channel Groups error copy → Thai (owner, 2026-11-25)

Translate only error/validation messages in `channel-groups/components/`, in the house style of the
other Media screens (Thai sentence, domain nouns `Channel` / `Group` / `Channel Group` / `Program` /
`Synchronized` kept in English as the UI shows them). Labels, headings and descriptions stay as they
are. Replace exactly:

| file:line | now | becomes |
|---|---|---|
| `ChannelGroupsPage.tsx:40` | Could not load Channel Groups. Try again. | โหลด Channel Group ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelGroupInspector.tsx:54` | Could not update this Group. Try again. | อัปเดต Group ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelGroupInspector.tsx:71` | Could not delete this Group. Try again. | ลบ Group ไม่สำเร็จ กรุณาลองใหม่ |
| `ChannelGroupInspector.tsx:70` (new, step 5) | raw Core "Already in use: …" | Group นี้ยังถูกใช้ใน Program: `<names>` กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อนลบ |
| `UngroupedChannelsTable.tsx:36` | This channel is already in another synchronized Group. | Channel นี้อยู่ใน Group แบบ Synchronized อื่นแล้ว |
| `UngroupedChannelsTable.tsx:37` | Could not add this channel to the Group. Try again. | เพิ่ม Channel เข้า Group ไม่สำเร็จ กรุณาลองใหม่ |
| `ManageChannelsModal.tsx:27` | A channel can only belong to one synchronized Group at a time. Remove it from the other Group first. | Channel หนึ่งอยู่ใน Group แบบ Synchronized ได้เพียง Group เดียว กรุณานำออกจาก Group เดิมก่อน |
| `ManageChannelsModal.tsx:30` | Could not update this Group's members. Try again. | อัปเดต Channel ใน Group ไม่สำเร็จ กรุณาลองใหม่ |
| `CreateEditGroupModal.tsx:51` | Group name is required | กรุณากรอกชื่อ Group |
| `CreateEditGroupModal.tsx:68` | A Channel Group with this name already exists. | มี Channel Group ชื่อนี้อยู่แล้ว |
| `CreateEditGroupModal.tsx:70` | (same as `ManageChannelsModal.tsx:27`) | (same Thai line) |
| `CreateEditGroupModal.tsx:72` | Could not save this Channel Group. Try again. | บันทึก Channel Group ไม่สำเร็จ กรุณาลองใหม่ |

The step-5 English example (`These Programs still use this Group: …`) is superseded by the Thai row above.
Re-grep the folder for any other English user-facing error string before finishing; list any found in
the report rather than inventing wording.

## Blast radius

`classifyApiError` has 74 call sites: 40 files in `media-workspace`, 3 in `people`
(`add-person/*WizardPage.tsx`, already pass Thai fallbacks and adopted it to hide raw 403 text).
Core raises no Thai text (`grep -rlP "RAISE[^;]*[ก-๙]" Thunder_Core/supabase/migrations` → 0 files),
so no caller loses meaningful Core wording. `console.error` will repeat on screens that reload
(e.g. `use-playlists-list-data.ts`); acceptable.

## Checks

- `node src/lib/api/api-error.check.mts`
- `node src/features/media-workspace/channel-groups/services/channel-groups-api-contract.check.mts`
- `npx tsc --noEmit`; `npx eslint` on touched files
- Browser (ask owner first, CLAUDE.md §3): (a) an unmatched Core error on a Media screen shows the
  fallback, raw text only in console; (b) the stale-draft Thai text (ADR 0086 §10) still shows.

## Not doing

- #460 refactor of error handling.
- Translating Channel Groups labels/headings; English-fallback copy sweep outside Channel Groups.
- Changing the `kind` of the non-`ApiError` branch.
- `FullPreviewPage.tsx:119` still says "Publication" — vocabulary, not #456; mention in the PR.
