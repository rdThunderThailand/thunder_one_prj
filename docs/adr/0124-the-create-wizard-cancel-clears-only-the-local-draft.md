# 0124 — The Create wizard's Cancel clears only the local draft

Status: accepted (2026-11-24, owner decisions in a grilling session).
**Workspace:** media
**Relates to:** ADR 0086 §2, §4, §5, §8 and §9 (the local Create draft and its resume prompt);
ADR 0123 (success is a toast, decisions are dialogs).

## Context

Until 2026-11-19 the Create Program wizard (`/media-workspace/program/create`) had a **Cancel** button
in the step 1 footer. Steps 2–5 had **Back** in that spot. The styling commit `0ef30fcc` (released in
v0.23.3) removed the step 1 footer on purpose, because picking content already advances the wizard. It
deleted the cancel flow with it: Cancel, `performCancel` and its Stay/Leave confirm. Nobody noticed
that Cancel was the wizard's only way out. Since then the operator can leave only through the sidebar
or the browser's Back. The local draft survives that. On the next blank `/create`, a draft with
unsaved work opens the resume prompt (ADR 0086 §2). A saved draft with no unsaved edits is cleared
without asking (§5).

On 2026-11-24 this trapped an operator on prod. The resume prompt saves the old draft before starting
over, that save failed every time, and the prompt cannot be dismissed (ADR 0086 §4). Continuing into
the wizard did not help, because every save there failed too and nothing on the page cleared the
draft. ADR 0086 §9 (amended 2026-11-24) adds a Discard to the prompt. It clears only the local draft
and sends nothing to the server. §9 left a wizard exit to a separate decision, and this ADR is that
decision.

The removed `performCancel` deleted the server row when `publicationId && !explicitlySaved`, as a best
effort with errors swallowed. Then it ran `cancelDraft()` and went to the Programs list. Since #226,
Next from step 2 creates that row automatically and leaves `explicitlySaved` false. The old rule would
therefore delete a draft the Programs list already shows. `explicitlySaved` becomes true in two ways:

- the operator presses **Save draft**;
- `openDraft` runs. That happens when a draft is opened from the Programs list or the detail page, or
  reloaded from the revision-conflict banner.

A plain reload of `/create?id=<id>` keeps the local copy and does not run `openDraft`.

## Decision

1. **One Cancel, in the page header, on every step.**
   - It goes in `PageHeader`'s `actions`, as an `outline`, `sm` button with no icon (the variant and
     size of the Edit page's Go Back).
   - It is disabled while any request that writes into the draft store is in flight: a save on Next or
     on a stepper jump, Save draft, Publish, and the revision-conflict banner's reload and overwrite.
   - Why: if such a request lands after the draft is cleared, it writes its id, snapshot or loaded
     draft into the emptied store. The save path's `router.replace('/create?id=…')` also pulls the
     operator back into the wizard.
   - The stepper jump has no busy flag today. This change gives it one.
2. **Cancel runs `cancelDraft()` only.**
   - Nothing is sent to the server and nothing is deleted from it. ADR 0086 §8 forbids deleting the
     server row in the seed and resume-prompt flow. This extends that rule to the whole wizard.
   - What was saved before is not touched.
   - A draft is deleted from the Programs list or the detail page, where it is in view and the delete
     has its own confirmation.
3. **Cancel always goes to `/media-workspace/program`.**
   - It does not read `returnTo` and does not use `router.back()`, even when the wizard was opened
     from an editor with a seed.
   - Why not `router.back()`: the previous history entry can be outside the app, as in a new tab or a
     link from elsewhere. The save path's `router.replace` has also already rewritten the `/create`
     entry.
4. **Cancel confirms only when something would be lost**, that is, when `isDraftDirty` is true. The
   confirmation is the copied Lovable `AlertDialog` that the Edit page uses.
   - Title: "ทิ้งการเปลี่ยนแปลงแล้วออก?"
   - Never saved: "คอนเทนต์ที่เลือก รวมถึงชื่อ คำอธิบาย และแท็กที่กรอกไว้ จะหายไปและกู้คืนไม่ได้"
   - Saved, with unsaved edits: "การแก้ไขที่ยังไม่บันทึกจะหายไปและกู้คืนไม่ได้ ส่วนที่บันทึกไว้แล้วไม่ถูกแตะ".
     This is the resume prompt's discard wording (ADR 0086 §9). It does not say that the draft is in
     the Programs list, because the client cannot know that: another tab or operator may have deleted
     or published it (ADR 0003).
   - Buttons: **Stay**, and **Discard and leave** (`destructive`).
   - Closing: Esc means Stay. A backdrop click does nothing, as in any Radix `AlertDialog`. Unlike the
     resume prompt (ADR 0086 §4), this dialog may be closed, because closing it keeps the operator in
     the wizard.

   An empty draft, or a saved draft with no unsaved edits, leaves without asking.
5. **Toasts** (ADR 0123 rules 1 and 5). Each is a `toast.success` with no action:
   - a saved draft's unsaved edits were discarded: "ทิ้งการแก้ไขที่ยังไม่บันทึกแล้ว", the same as the
     resume prompt's discard (ADR 0086 §9);
   - a never-saved draft was discarded: "ทิ้ง draft แล้ว";
   - an empty draft, or a saved draft with no unsaved edits: no toast. Nothing changed; the operator
     only left.
6. **No leave guard.** Leaving through the sidebar, or reloading, keeps the local draft. The resume
   prompt picks it up on the next visit. The Edit page guards because it has no local draft to fall
   back on.
7. **`explicitlySaved` is removed from the draft store.**
   - Its only reader was `performCancel`, and this decision gives it no new one.
   - Removing it needs no storage key bump: `merge` spreads the stored object, so an older draft's
     leftover field is carried along unread.

## Considered options

- **Delete the server row as before**, when `!explicitlySaved` and as a best effort.
  - Since #226 this deletes a draft the Programs list already shows.
  - Whether it deletes depends on how the draft was reached: opened from the list, or saved with
    Save draft, versus created by Next.
  - A failed delete is invisible.
  - Another operator may be editing the same draft (ADR 0003).
- **Offer the delete inside the confirmation**, as a real delete that reports its failure. This
  duplicates the delete on the Programs list, needs more copy, and adds a step that can fail to the
  way out.
- **Cancel on step 1 only**, as before. Step 1 no longer has a footer, so the button needs a new place
  anyway. An operator on step 4 would have to press Back three times to reach it.
- **Cancel in the footer beside Back on steps 2–5, and in the header on step 1.** That puts one action
  in two places.
- **Save and leave in the confirmation.** It would put a save that can fail back into the way out,
  and a save failing every time is what trapped the operator. Save draft is already in the footer.
- **Copy and a toast saying the draft stays in the Programs list.** The client cannot know that this
  is true (Decision 4). ADR 0086 §9 dropped a similar sentence for the same reason.
- **A leave guard (`useLeaveGuard`) as on the Edit page.** Nothing is lost on the Create page by
  leaving, so it would only add a prompt.
- **The label "Go Back".** It reads like the footer's "Back: <step>".
- **An amendment to ADR 0086.** ADR 0086 is about the editor seed and the resume prompt, and its §9
  was still uncommitted when this was decided.

## Consequences

- A draft abandoned after step 2 stays as a Draft row in the Programs list until someone deletes it.
- An upload on step 1 that finishes after Cancel still adds its Asset to the draft and advances it,
  because the upload callback has no unmount guard. The next blank `/create` then shows the resume
  prompt for a never-saved draft, and the operator can start fresh from there. This is rare and
  harmless, so it is not guarded.
- ADR 0086 §9 lists "Restore a wizard exit" under Considered and leaves it to a separate decision.
  Whichever of the two changes merges second updates that entry to point to this ADR.
