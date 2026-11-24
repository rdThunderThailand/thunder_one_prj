# An editor seed wins over the local Create draft

**Status:** accepted · 2026-10-07
**Supersedes:** `0072-the-create-wizard-reshapes-the-steps-not-the-publication.md` §3, second paragraph (the resume-prompt rule). The rest of §3 — editors hand off through a seed parameter, no `returnTo` round-trip — stands.
**Source:** MW-003 BUG-07, issue #228; triage in `docs/media-workspace/bug-triage-mw-003.md`
**Amended:** 2026-11-24 — §9 (the prompt offers to discard the unsaved edits of a saved draft);
2026-11-24 — §10 (a stale draft id creates a new Program only when the operator chooses Save as new)

## Context

An operator presses **Publish** in the Composition editor and lands on
`/media-workspace/program/create?compositionId=<id>`. If localStorage holds a draft with "content", the
resume prompt opens. Its primary button ("continue") and closing it with Esc or a backdrop click
(the `Modal` it uses has no X here) all make `resolveSeed` return `discard`, so the Composition they
just published is dropped and the wizard sits at the old draft's step. That is ADR 0072 §3 working as
written: only a fresh start is seeded, so a draft is never overwritten.

Two facts make the prompt fire almost every time. `hasDraftContent` counts a name alone, or
`step > 1`, as content. The local draft is cleared only on Cancel, Publish, or the prompt's own
"start fresh" button. (Cancel was removed on 2026-11-19; see §9.)

Since #226, Next and stepper jumps persist the draft to the server and call `markSaved()`. The name is
entered on step 2 (Prepare Content), and `persistDraft` skips the server while the name is empty, so
the first server row appears on Next from step 2. A draft past step 2 therefore has a `publicationId`
and a server row the operator can reopen from the Programs list; a draft on step 1 or 2 usually has
neither. Next from step 1 still calls `markSaved()` although nothing was persisted.

`markSaved()` snapshots every field, but `persistDraft(false)` sends targets only when `step >= 3` and
the schedule only when `step >= 4` and it is valid. The schedule is edited on step 3, and Next from
step 3 runs while `step === 3`. A schedule can therefore be marked saved without ever being sent, and
going Back to step 2 and pressing Next again marks Channel picks saved without sending targets.

## Decision

### 1. The seed wins by default

Arriving with a seed starts a new Program from that content. The old draft is never written into. The
seed may be a Composition, a Playlist or an Asset (`?compositionId=` / `?playlistId=` / `?assetId=`),
and all three follow the same rule through the one resolver.

### 2. The prompt asks only when something would be lost

A local draft counts as unfinished work only when one of these is true:

- it was never saved, so it has no `publicationId` and holds something by `hasDraftContent`. After
  #226 this is a draft that has not yet passed Next on step 2: content picked on step 1, or a seed
  just applied, plus whatever name, description or tags were typed on step 2;
- it has a `publicationId`, and `serializeDraftFields(s) !== s.savedSnapshot` (edits not yet
  persisted; the same test `useIsDraftDirty` makes).

A draft that is saved and clean is not unfinished work. The page clears it from local with
`cancelDraft()` and applies the seed without asking.

**Precondition — "saved" must mean "sent".** This rule is only safe once a clean snapshot guarantees the
server holds the same data for the steps reached. `persistDraft(false)` therefore sends the targets
whenever `Math.max(step, furthestStep) >= 3` and the schedule under that same condition when it is
valid, on Next, on a stepper jump, and on Back-then-Next alike. Using `furthestStep` keeps Program
edits included after Back to step 1 or 2. That fix ships with or before this ADR.
`markSaved` uses the fields captured before the request, never later edits made while it was pending.
A skipped empty-name save never marks the draft saved; Next from step 1 can still advance locally.

### 3. The prompt names the content and says what happens

*For a saved draft, §9 renames the primary button, rewords the description, and adds a third
button, Discard changes…, which also shows during a revision conflict.*

- **Primary — "Use <content name>"**
  - If the old draft has a `publicationId`, save its pending edits first through the stepper-jump
    path: `persistDraft(false)` then `markSaved()`, without `validateStep`. The draft may sit
    mid-edit on a step that does not validate yet, and that must not block the save.
  - If the save cannot run or fails, stay on the prompt and show why:
    - an empty name, which `persistDraft` today skips silently;
    - a network or server error;
    - a server row that was deleted, cancelled or published elsewhere (§10);
    - a revision conflict. Only "Continue the previous draft" is offered then, plus Discard
      changes… (§9), because the reload/overwrite banner sits behind the prompt.
  - An invalid schedule after Program has been reached does not block. Save the other fields, drop
    the schedule edit, and go on: choosing the new content overrides it. A schedule that passed its
    time while the draft was parked would otherwise force the operator to fix a draft they are
    leaving. The prompt says up front that the schedule will not be saved.
  - Wait for the Channel list to load before saving, because targets are built from it.
  - Then `cancelDraft()`, apply the seed, and go to step 2.
- **Secondary — "Continue the previous draft"**
  - Drop the seed openly and leave the draft as it is.

The prompt says that the previous draft stays in the Programs list (for a saved draft, §9 replaces
this wording). When the old draft was never saved, it also says that its unsaved name, description
and tags will be lost.

The prompt renders at once with a generic label ("Use the published Layout", "… Playlist",
"… media"). The name is filled in when it arrives and never blocks the prompt: an Asset name comes
from the loaded list, and a Composition or Playlist name needs a fetch.

### 4. The prompt cannot be dismissed

The prompt has no X. Esc and a backdrop click do nothing. The operator must press one of its
buttons (§9 adds a third for a saved draft). Closing a dialog must not make a choice for the operator:
the earlier behaviour did, and that was this bug. Focus is trapped on the buttons, so the keyboard
path stays complete.

It is built on the copied Lovable `AlertDialog` (`src/components/ui/lovable/alert-dialog.tsx`), with
`onEscapeKeyDown` prevented. The current `Modal` is a native `<dialog>`: Chrome's close watcher can
still close it on a repeated Esc, and its raw `zinc`/`bg-white`/`dark:` classes are what ADR 0075/0076
forbid in Media Workspace.

### 5. A blank `/create` starts fresh over a saved, clean draft

When `/create` opens without a seed, the same rule as §2 applies. A saved, clean draft is cleared from
local and the wizard starts empty. "Create Program" yields a new Program. The old one is reachable from
the Programs list. Without this rule, the next Next would PATCH it without the operator knowing.

For a reload not to lose the Program being built, the first successful save replaces the URL with
`/create?id=<publicationId>`. A reload then goes through edit mode, and this rule only affects a truly
new visit. The rule is evaluated once, when the store hydrates, never on a `searchParams` change,
because the seed path's own `router.replace` would otherwise trigger it again.

### 6. A seed that cannot be applied clears nothing

A seed whose id does not resolve, such as an Asset missing from the loaded list or a Composition or
Playlist that fails to load, shows a visible error and drops the seed from the URL. A saved, clean
draft is cleared only once the seed is known to apply.

### 7. Save draft sits in the wizard footer

The **Save draft** button moves from the page header to the footer, left of **Next**. There is still
one button, with the same behaviour: disabled while saving or while the name is empty. The operator
reaches it at the moment they decide to stop, beside the button they would otherwise press.

### 8. Guard rails

- Never delete the server row from this flow. (`performCancel`, which deleted the row of a draft not
  explicitly saved, was removed with the step 1 footer on 2026-11-19, `0ef30fcc`.)
- Never clear the local draft when opening with `?id=`, because edit mode loads into the same store.
- A change to the persisted store shape bumps the storage key from `v14` to `v15`.

### 9. The prompt offers to discard the unsaved edits of a saved draft

*Amended 2026-11-24, owner decisions in a grilling session.*

§3 saves the old draft before the operator leaves it, and §4 makes the prompt the only way forward.
When that save fails every time, the operator is stuck. The primary button fails, and "Continue the
previous draft" leads to a wizard where every save fails too. Until 2026-11-19 the wizard still had
a way out: Continue, Back to step 1, **Cancel**, **Leave**. That Cancel went with the step 1 footer in
a styling commit (`0ef30fcc`, released in v0.23.3) by accident, not by decision, and since then the
prompt has had no exit. On 2026-11-24 this happened on prod. A local draft started under one tenant
was opened under another. Its Channel pick did not exist there, so every save got `not found:
channel … not found for this tenant`. PR #469 keys the local draft by user and tenant, which removes
that cause. Any failure that repeats can still trap the operator: a pick the picker cannot show or
remove, a lost permission (403), or a server that keeps failing.

The prompt therefore lets the operator choose from the start whether to save those edits or
discard them. A trapped operator gets the same way out.

- **Scope.** This applies when the old draft has a `publicationId`: a saved draft with unsaved edits
  (§2). A never-saved draft keeps §3 as it is. Its primary button already starts over and says what
  is lost, and keeping it as a draft would need a new server row, which this ADR rejects.
- **Buttons.**
  - Primary: **Save and start new**, or **Save and use <content name>** (generic labels: "Save and
    use the published Layout", "… Playlist", "… media"). It behaves as in §3. The new label says
    that it saves, because the button beside it does not.
  - **Discard changes…**, left of the other two and with less emphasis (`ghost`). It shows from the
    start, and also during a revision conflict, when the primary button is hidden. It is disabled
    while a save runs and while a seed's content is still loading, because applying the seed needs
    it. It does not wait for the Channel list, because it saves nothing.
  - **Continue the previous draft**, unchanged.
- **Description.** "draft เดิมมีการแก้ไขที่ยังไม่บันทึก บันทึกไว้ก่อนเริ่ม Program ใหม่ หรือทิ้งการแก้ไขนั้นก็ได้"
  replaces the sentence saying that the previous draft stays in the Programs list. That sentence was
  not always true. In the prod case the draft belonged to the other tenant, and the save had already
  failed to create a new one.
- **Confirmation.** Pressing Discard changes… shows a confirmation inside the same dialog. There is
  no second dialog, so §4's focus trap still holds, and focus moves to **Back**. The text is
  "การแก้ไขที่ยังไม่บันทึกของ draft เดิมจะหายไปและกู้คืนไม่ได้ ส่วนที่บันทึกไว้แล้วไม่ถูกแตะ",
  followed by "จากนั้นจะเริ่ม Program ใหม่" or "จากนั้นจะใช้ <content name>". **Back** returns to the
  prompt, with focus on Discard changes…. **Discard and start new** or **Discard and use <content name>** (`destructive`) goes ahead.
- **What discarding does.** It runs `cancelDraft()` only, which clears the local draft. Nothing is
  sent to or deleted from the server (§8), so whatever was saved before is not touched. The
  revision-conflict banner is cleared as well, because it was about the edits just discarded. Then
  the page continues as it does after a successful save: it applies the seed and goes to step 2, or
  starts an empty wizard.
- **Toasts** (ADR 0123 rules 1 and 5). Work on this prompt touches its success path too, so both
  outcomes report:
  - after a discard, "ทิ้งการแก้ไขที่ยังไม่บันทึกแล้ว";
  - after the primary button has saved the old draft, "บันทึก draft เดิมแล้ว".

  Neither toast has an action. The operator has just chosen to start here, so a link away is not
  the next step.
- **Error text** stays as it is (§3).

Saving stays the primary action. Discarding is a choice the operator makes, behind a confirmation,
never something a failure or a closed dialog makes for them.

Facts found while deciding (2026-11-24, read from the code, not run):

- The prod error classifies as `rejected` (publish cause `targets`), not `not-found`.
  `classifyPublishCause` matches `not found: channel …` before `classifyApiError` checks for a 404.
- A server draft that was deleted or has left `draft`, or belongs to another tenant, sends the save
  down a stale-id path. The exception is a draft that references another tenant's Composition or
  Playlist: `media_publication_upsert` checks those first and fails before it looks up the id. `persistDraft` treats `publication not found for this tenant` and `only draft
  publications can be edited` as a stale id and creates a new draft (`isStaleDraftError` in
  `usePublishDraft.ts`). That frees the operator only when the create succeeds. In the prod case it
  most likely failed too: `media_publication_upsert` checks the id before the targets, so the create
  hit the foreign Channel. §10 has since stopped that create from happening on its own.

### 10. A stale draft id creates a new Program only when the operator chooses Save as new

*Amended 2026-11-24, owner decisions in a grilling session.*

The local draft keeps its `publicationId` after its server row was deleted, cancelled or published
somewhere else: in another tab, by another operator, or from the Programs list. `persistDraft` used
to recover from that without asking. On `publication not found for this tenant` or `only draft
publications can be edited` (`isStaleDraftError`), it re-minted the idempotency key and created a new
draft from the local fields. Every save went that way: Next, a stepper jump, Save draft, Publish,
and the prompt's primary button. As a result:

- the Programs list gained a Program the operator did not ask for, and the toast said the old draft
  had been saved ("บันทึก draft เดิมแล้ว" in the prompt, "บันทึกร่างแล้ว" in the wizard);
- Publish created that row and then activated it (`publishNow` runs `persistDraft(true)`, then
  `activatePublication`). A draft someone had deleted came back on air, and a draft already
  published elsewhere aired a second time.

The decision:

- **One rule for every save.** `persistDraft` no longer creates a row by itself. On a stale id it
  throws "draft เดิมถูกลบ ยกเลิก หรือเผยแพร่ไปแล้ว จึงบันทึกลงไปไม่ได้", and the page remembers that
  this id is stale. It creates a new row only when called with `{ asNew: true }`, and only a button
  the operator presses after seeing that message passes it. `isStaleDraftError` stays the one test,
  so the prompt and the wizard cannot drift apart.
- **Found on save, not checked up front.** Nothing fetches the row when the prompt or the wizard
  opens. The operator learns about it on the first save, which is when it matters.
- **The prompt** (§3, §9). The primary button's save fails with that message. The button then reads
  **Save as new and start new** or **Save as new and use <content name>**. Pressing it saves the old
  draft's fields as a new draft, then goes on as in §3. Discard changes… and Continue the previous
  draft are unchanged. The discard confirmation keeps its text, which stays true because nothing is
  sent to the server.
- **The wizard.** The same message shows in the error block. While it applies, the footer's
  **Save draft** reads **Save as new draft** and saves with `{ asNew: true }`. No second button is
  added. Retry is hidden, since it would only fail again. Next and Publish keep failing with the
  message until the operator saves as new. After that the wizard stays on its step, as Save draft
  always does, so Publish never creates a row and airs it in one click.
- **Step 1** has no footer. While the id is known to be stale, a stepper jump does not save first,
  because there is no row to save to and the fields stay in localStorage. That keeps Save as new
  draft reachable on step 2.
- **Toast** after a save as new, in the prompt and in the wizard: "บันทึกเป็น draft ใหม่แล้ว", with no
  action (ADR 0123 rules 1 and 5).
- **What is remembered** is the stale id itself, in component state. It is not persisted, so the
  store shape and its storage key do not change. It stops applying as soon as the draft's
  `publicationId` changes, after a save as new or a discard. A reload forgets it, and the next save
  finds it again.

Saving as new stays a choice the operator makes after reading why, never something a failure makes
for them. This is the same rule as §9.

## Considered and rejected

- **Merge the seed into the existing draft** after a confirmation. This would overwrite Channels and a
  schedule chosen for other content, and the operator who pressed Publish expects a new Program.
- **Keep ADR 0072 §3 and only reword the prompt.** The operator would still not get the content they
  published.
- **Never prompt.** A never-saved draft would vanish silently.
- **Discard pending edits instead of saving them first** (the triage's first proposal). This loses
  work in the case that matters most, a saved draft with later edits, when the save path already
  exists. §9 does not reverse this. Saving stays the primary button, and discarding is a second
  choice behind a confirmation.
- **Save a never-saved draft by creating a server row.** It needs a name, and it would turn every
  half-typed draft into a junk row.
- **Save the old draft through the Next path.** `validateStep` would refuse a draft parked mid-edit.
- **Let `markSaved` snapshot only what was sent**, instead of sending everything. This keeps data off
  the server and makes the dirty test depend on the step.
- **Accept that a reload of a blank-`/create` Program starts empty.** This undoes the reason the draft
  is stored locally at all.
- **Esc = use the content, Esc = continue, or Esc = go back.** The first two let dismissal decide. Going
  back needs a fallback when there is no history, such as a new tab, and that is more code than a
  prompt this rare is worth.
- **A second Save draft button in the footer, keeping the header one.** Two buttons would do the same
  thing in two places.
- **Offer discard only after a failed save** (§9). The operator
  would learn that the choice exists only once something has gone wrong, and the prompt would have
  to remember that a save failed. A **narrower form, only on permanent errors** (`not-found` and
  `forbidden`, or everything that is not `retryable`), was also weighed. Limited to `not-found` and
  `forbidden`, it misses the case that happened, which was `rejected`. Widened to everything that is
  not `retryable`, it still traps the operator on a server that keeps failing or a Channel list that
  will not load. Both forms depend on message matching, which drifts as Core's wording changes.
- **Delete the server draft as part of discarding** (§9). In exactly the cases that trap the
  operator (another tenant, a 403, a server that keeps failing) the delete fails too. It would have to
  be best-effort, like the removed Cancel, so the operator could not tell whether it happened. Other
  operators in the tenant may be editing the same draft (ADR 0003). Deleting belongs on the Programs
  list and detail page, where the draft is in view and the delete has its own confirmation.
- **Restore a wizard exit, such as the removed Cancel, instead** (§9). That is a wider question. It
  serves every visit, and the removed Cancel also deleted the server row of a draft that was not
  explicitly saved. It is left to a decision of its own. §9 removes the trap inside the prompt
  without touching the server. An operator who pressed Continue first gets the choice again on the
  next visit to a blank `/create`.
- **Fix the unremovable pick at its source instead** (§9). The wizard shows only Channels in the
  loaded list (`ChannelsStep`, `ProgramSummaryRail`), while `targetsFromSelection` still sends a
  picked id that is missing from it. The problem-target notice covers only targets Core returns.
  Extending that notice to local picks missing from the list, in line with ADR 0122 rule 17, is worth a
  follow-up. It would not replace §9, which also covers a 403 and a server that keeps failing.
- **Show the classified error in place of the generic one** (§9). In the prod case it would have said
  to pick other targets, but the foreign Channel was not in the picker to remove.
- **On a stale id, skip the create in the prompt and treat it as Discard** (§10). The edits would be
  lost because of a failure, not because the operator chose to lose them, and §9 rules that out.
- **Hide the prompt's primary button, as during a revision conflict, and leave Continue and Discard**
  (§10). To keep the edits and still use the published content, the operator would have to Continue,
  press Save draft, go back to the editor and press Publish again.
- **Keep the silent create and fix only the toast** (§10). The operator would still get a row they
  did not ask for, and Publish would still put a deleted or already published Program back on air.
- **Stop the silent create on Publish only** (§10). That closes the on-air risk but leaves two rules,
  and Next and Save draft would keep leaving stray drafts.
- **Check the id when the prompt or the wizard opens** (§10). That is an extra request on every
  visit, for a case that is rare.
- **A separate Save as new draft button beside the error** (§10). The footer's Save draft can do it.
  One button whose label says what it does is enough.

## Consequences

- `savedSnapshot` lives on the store, not on `DraftFields`, so `hasDraftContent`'s `Pick<DraftFields, …>`
  cannot simply gain it: a sibling predicate takes `publicationId` plus an `isDirty` boolean (or the
  snapshot). `serializeDraftFields` is module-private in `usePublicationDraftStore.ts`, and that module
  cannot load under bare `node`, so `resume-prompt.check.mts` passes `isDirty` in rather than importing
  it. The check gains the saved-clean and saved-dirty cases.
- `resolveSeed` keeps its three outcomes. Only who asks changes, so `seed-resolver.check.mts` is
  updated, not rewritten.
- The resume prompt's copy changes for the plain `/create` case too, since it now fires only with
  unsaved work.
- The prompt is rarer, but when it fires, choosing the primary button can cost a network round-trip
  before the wizard moves on.
- Sending the schedule once step 3 has been reached means an invalid schedule is still held back.
  Every save caller leaves the snapshot unchanged after such a partial save, so a draft parked on
  step 3 (or taken Back to an earlier step) with pending invalid schedule edits stays dirty, and
  the prompt in §2 asks. The primary action then drops those schedule edits (§3); the rest of the
  draft is saved.
- `ChannelGroupInspector.tsx:120` links to `/create?group=<id>`, which the page never reads. It behaves
  as a blank `/create` and falls under §5. That is out of scope here.
- §9 adds a confirmation view and, for a saved draft, a third button to `DraftResumePrompt`. The
  persisted store shape does not change, so the storage key stays as it is.
- §10 changes what every wizard save does with a stale id: it fails until the operator chooses Save
  as new. The old comment's worry, a wizard bricked by a dead id, does not come back, because Save as
  new draft can always be reached (from step 1 through the stepper).
- A Publish retried after a timed-out activation now stops at the stale message instead of creating
  and airing a duplicate. `persistDraft` runs before `activatePublication`, so on that retry the save
  is refused first and `publishNow`'s `already-active` branch is not reached (read from the code, not
  run). Showing that case as published is left open.
