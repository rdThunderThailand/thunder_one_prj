# An editor seed wins over the local Create draft

**Status:** accepted · 2026-10-07
**Supersedes:** `0072-the-create-wizard-reshapes-the-steps-not-the-publication.md` §3, second paragraph (the resume-prompt rule). The rest of §3 — editors hand off through a seed parameter, no `returnTo` round-trip — stands.
**Source:** MW-003 BUG-07, issue #228; triage in `docs/media-workspace/bug-triage-mw-003.md`

## Context

An operator presses **Publish** in the Composition editor and lands on
`/media-workspace/program/create?compositionId=<id>`. If localStorage holds a draft with "content", the
resume prompt opens. Its primary button ("continue") and closing it with Esc or a backdrop click
(the `Modal` it uses has no X here) all make `resolveSeed` return `discard`, so the Composition they
just published is dropped and the wizard sits at the old draft's step. That is ADR 0072 §3 working as
written: only a fresh start is seeded, so a draft is never overwritten.

Two facts make the prompt fire almost every time. `hasDraftContent` counts a name alone, or
`step > 1`, as content. The local draft is cleared only on Cancel, Publish, or the prompt's own
"start fresh" button.

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

- **Primary — "Use <content name>"**
  - If the old draft has a `publicationId`, save its pending edits first through the stepper-jump
    path: `persistDraft(false)` then `markSaved()`, without `validateStep`. The draft may sit
    mid-edit on a step that does not validate yet, and that must not block the save.
  - If the save cannot run or fails, stay on the prompt and show why:
    - an empty name, which `persistDraft` today skips silently;
    - a network or server error;
    - an invalid schedule after Program has been reached: save the other fields, but do not
      `markSaved`, clear the draft, or apply the seed. Continue the previous draft to fix it;
    - a revision conflict. Only "Continue the previous draft" is offered then, because the
      reload/overwrite banner sits behind the prompt.
  - Wait for the Channel list to load before saving, because targets are built from it.
  - Then `cancelDraft()`, apply the seed, and go to step 2.
- **Secondary — "Continue the previous draft"**
  - Drop the seed openly and leave the draft as it is.

The prompt says that the previous draft stays in the Programs list. When the old draft was never
saved, it also says that its unsaved name, description and tags will be lost.

The prompt renders at once with a generic label ("Use the published Layout", "… Playlist",
"… media"). The name is filled in when it arrives and never blocks the prompt: an Asset name comes
from the loaded list, and a Composition or Playlist name needs a fetch.

### 4. The prompt cannot be dismissed

The prompt has no X. Esc and a backdrop click do nothing. The operator must press one of the two
buttons. Closing a dialog must not make a choice for the operator: the earlier behaviour did, and that
was this bug. Focus is trapped on the two buttons, so the keyboard path stays complete.

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

- Never call `performCancel` here. It deletes the server row when the draft was not explicitly saved.
- Never clear the local draft when opening with `?id=`, because edit mode loads into the same store.
- A change to the persisted store shape bumps the storage key from `v14` to `v15`.

## Considered and rejected

- **Merge the seed into the existing draft** after a confirmation. This would overwrite Channels and a
  schedule chosen for other content, and the operator who pressed Publish expects a new Program.
- **Keep ADR 0072 §3 and only reword the prompt.** The operator would still not get the content they
  published.
- **Never prompt.** A never-saved draft would vanish silently.
- **Discard pending edits instead of saving them first** (the triage's first proposal). This loses
  work in the case that matters most, a saved draft with later edits, when the save path already
  exists.
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
  the prompt in §2 asks. The primary action keeps the prompt open rather than losing those edits.
- `ChannelGroupInspector.tsx:120` links to `/create?group=<id>`, which the page never reads. It behaves
  as a blank `/create` and falls under §5. That is out of scope here.
