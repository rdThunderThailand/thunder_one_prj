# 0017 — Create Playlist Step 1: three ticket requirements amended, not implemented

## Context

Ticket [86d3xxk5b](https://app.clickup.com/t/86d3xxk5b) (`[FLOW] Create Playlist – Step 1: Basic
Info`) was verified line by line against `thunder_one_prj` @ `ae37fa6`; the gap analysis lives in
`docs/playlists/plan-create-playlist-step1.md`. Fourteen of its acceptance criteria are already
satisfied and five are simply unimplemented, but three of them describe behaviour the codebase
deliberately does the opposite way — each backed by a decision already made, shipped, and in one
case already recorded as an ADR. Those three could not be coded around: implementing the ticket
means reverting a decision, and keeping the code means the ticket is wrong. This ADR records which
way each was resolved, and what the rejected option would have cost.

## Decision

**Campaign stays optional on Step 1 (AC 7).** The ticket and the mockup both mark Campaign as
required before Step 2; `BasicInfoStep.tsx:63` renders it `optional` and `validateStep` never
checks it. The ticket's own "จุดที่ควรให้ทีม Product ยืนยัน" §3 lists this as an open product
question rather than a settled requirement, so there is no authority behind the mockup's required
marker beyond the marker itself. Keeping it optional preserves playlists that exist independently
of any one campaign — a central or reusable playlist that several campaigns later point at —
which the required version makes structurally impossible, and it leaves existing drafts with no
campaign able to pass Next. AC 7 is amended; the mockup's required marker is wrong.

**Rejected: making Campaign required.** It is about ten lines — add the field to
`validateStep(1)`, flip the `Field` to `required` — and it matches both the ticket and the mockup,
which is the strongest argument for it. It was declined because it buys ticket-conformance by
removing a capability nobody agreed to remove: every playlist would have to be born attached to a
campaign, and the reusable-playlist case would have to be reopened later as new work. Campaign is
stored as metadata (AC 8), so a playlist can be re-pointed at any time — the constraint would only
ever bind at creation, which is the moment the operator is least likely to know the answer. If
product later confirms that every playlist genuinely belongs to exactly one campaign, this is
cheap to reverse in the other direction.

**Next remains local-only; a row is written only by Save Draft or final submit (AC 22 / 29).** The
ticket requires Next to save the draft successfully before Step 2 opens. ADR 0014 decided the
opposite, and did so specifically to close two reported problems: abandoned wizards leaving
invisible `status = 'draft'` rows in production with no UI path to see or discard them, and the
resume prompt firing on the first keystroke of a brand-new playlist. AC 22/29 predate ADR 0014.
They are amended to read: Step 2 continues the same local draft, and a server row exists only
after an explicit save. The product need underneath those criteria — "don't lose work" — is
already met by the `localStorage` persistence in `usePlaylistDraftStore.ts`, which survives refresh
and tab crash independently of any network call.

**Rejected: reverting to save-on-Next.** This is what the ticket literally asks for, and it would
restore a server-side draft that survives a browser change or a different device, which
`localStorage` cannot. It was declined because it reinstates exactly the two defects ADR 0014 was
written to fix, in exactly the form they were reported in — not a variation of them. ADR 0014 also
already considered and rejected the softer version of this (an `explicitly_saved` column that
keeps the write but hides the row), for the same reason: relabeling the write does not stop the
write. Cross-device draft recovery remains a real capability that nobody has asked for.

**The playlist cover stays a pick from the playlist's own media (AC 16 / 17).** The ticket
describes the cover as an uploaded image capped at 5 MB, explicitly not counted as a content item.
The code stores `info.coverAssetId` (migration 083's `cover_asset_id`) and resolves it at read
time, with no write-back on reorder. AC 16/17 are amended to describe the media pick. The 5 MB cap
and the "cover is not content" rule both fall away with the upload they were written for.

**Rejected: a real cover upload (and rejected again: supporting both).** A genuine upload needs a
storage bucket path for playlist covers, a 5 MB gate, a `cover_storage_key` column, signed-URL
plumbing, and a stated rule for how it interacts with the existing `cover_asset_id` — roughly the
size of the entire remaining ticket. What it actually fixes is AC 17: a cover that is not one of
the playlist's items. That is a cosmetic concern on a Step 1 form, and it does not justify a new
storage surface. Supporting both sources was rejected outright: it leaves one thumbnail with two
sources of truth and a precedence rule that every read path has to remember. Revisit only if
operators ask for covers that are not in the playlist.

## Consequences

All three decisions resolve toward the code, so none of them produces a code change — the work
they unblock is documentation: the three acceptance criteria are amended on the ticket, and this
ADR is the record of why. Anyone reading the ticket without this ADR will read three requirements
that the implementation knowingly does not meet.

The verdict on the ticket does not change to "passed". Five acceptance criteria (12, 14, 16's
upload half now removed, 26, 30) remain genuinely unimplemented, and AC 10 — whether `dynamic`,
`loop`, and `manual` playlist types are producible at all — is still an open product question.
Those are tracked in `docs/playlists/plan-create-playlist-step1.md`.

AC 7 and AC 22/29 are both cheap to reverse if product overrules this; AC 16/17 is not — building
the upload later is the same amount of work as building it now, no more and no less, since nothing
here forecloses it.
