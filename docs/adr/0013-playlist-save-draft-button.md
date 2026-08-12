# 0013 — Add a Save Draft button to the playlist wizard, on top of ADR 0012

## Context

ADR 0012 shipped DB-backed drafts for playlists and explicitly rejected a separate "Save Draft"
button: "**Draft row created on first "Next" from the info step** ..., not on every keystroke and
not behind a separate "Save Draft" button — matches how publications trigger `persistDraft`."
That comparison was incomplete. `CreatePublicationPage.tsx:325` renders a `Save as Draft` button
wired to `usePublishDraft().saveDraft()`, which calls the same `persistDraft` that `handleNext`
also calls on every step. Publications has both mechanisms — an explicit save action *and* an
implicit one riding on Next — not the implicit one alone. ADR 0012's premise is factually wrong,
so this ADR supersedes that specific rejection rather than reaffirming it.

Separately, ADR 0012's auto-save turned out to be narrower in practice than the ADR described.
`CreatePlaylistPage.goNext()` (before this change, commit `220a162`'s parent) only persisted on
`step === 1`, and even then only sent `name` and `status` — no metadata, no items:

```
if (step === 1) {
  const res = await upsertPlaylist({
    name: name.trim(),
    status: existingId ? undefined : "draft",
    playlistId: existingId,
    expectedRevision: current.revision,
    idempotencyKey: current.idempotencyKey,
  });
  ...
}
```

A user who filled in metadata on step 2 or picked media on step 3 and then crashed or refreshed
lost all of it — the persisted row had nothing but a name. ADR 0012's stated motivation, "data
loss on refresh/crash during a long edit," was barely served by what actually shipped. Both fixes
land together here: `goNext` now calls `persistDraft({ activate: false })` on every step, writing
name, metadata, and items in one cycle (`usePlaylistDraftSave.ts`), and an explicit "Save Draft"
button is added to steps 1-3 so the user is not limited to waiting for the next step transition.

## Decision

**Add a "Save Draft" button to the Basic Info, Metadata, and Content steps**, calling the same
`persistDraft({ activate: false })` used by `goNext`. This corrects ADR 0012's rejection: the
premise that publications does without one was wrong, and now that `goNext` carries the full
payload every time, adding the button is a small, consistent addition rather than a new
mechanism.

**The button does not run `validateStep`.** Rejected: gating it behind the same validation
`goNext` runs. `goNext`'s validation exists to stop the wizard from advancing with incomplete
data — it is a step-transition gate, not a save gate. A Save Draft button that refused to save
until a step passed validation would refuse to save exactly the incomplete, in-progress work it
exists to protect. The button's only guard is a non-empty name, because the backend rejects an
empty name outright (same reasoning as publications' `saveDraft`).

**The button does not appear on the Review step.** Rejected: showing it on every step including
Review. By the time the user reaches Review, `goNext` has already persisted everything on the way
there — there is nothing left unsaved for an extra button to catch. Adding it there would be a
control with no effect.

**Deferred, with reasoning: a Cancel button, publications' `explicitlySaved` flag, and a
`media_playlist_delete` RPC.** Publications' wizard has all three working together: Cancel checks
`explicitlySaved` to decide whether an unsaved draft needs confirmation before discarding, and
discarding calls a delete RPC. Playlists have none of them. This was confirmed against
production rather than assumed: `media_publication_delete` exists, but no playlist equivalent
does, and `/media/playlists/[id]/route.ts` (Thunder_Core) exposes only GET and PATCH — no DELETE.
Building the playlist equivalent needs a new RPC, a new route, and a production migration; that
is a separate R0 cycle in its own right, not a rider on this frontend-only change. The consequence
is the same gap ADR 0012 already accepted and recorded (L111-115 there): abandoned draft rows
keep accumulating invisibly, with no way for the user to explicitly discard one from the wizard.
This ADR does not change that; it is called out again here because the Save Draft button makes an
in-progress draft more discoverable without giving the user any way to undo it.

## Consequences

Playlists now have two paths that persist a draft — `goNext` and Save Draft — matching
publications' shape exactly. Any future change to what a save cycle writes
(`usePlaylistDraftSave.persistDraft`) affects both paths identically, since they share the same
function; there is no risk of the two drifting apart the way ADR 0012's original name-only /
step-1-only `goNext` diverged from the ADR's own description of itself.

The wizard still has no Cancel action and no way to delete an abandoned draft. A user who starts
a playlist, saves a draft (explicitly or via Next), and then navigates away leaves a `status =
'draft'` row behind permanently, with no UI path back to it or away from it. This is unchanged
from ADR 0012 and is not addressed here; it is deferred to the backend work described above.
