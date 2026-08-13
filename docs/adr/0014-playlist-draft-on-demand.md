# 0014 — Playlist drafts are created on demand, not on first Next

## Context

ADR 0012 decided that a draft row is "created on first 'Next' from the info step" and rejected a
separate Save Draft button as unnecessary, on the premise that this matched how publications work.
ADR 0013 already corrected the second half of that: the premise was wrong (publications has both
`persistDraft`-on-Next and an explicit Save Draft button), so a Save Draft button was added
alongside `goNext`, and `goNext` was widened from a step-1-only, name-only write into a full
`persistDraft({ activate: false })` call on every step transition. That left the first half of
ADR 0012's decision untouched: walking the wizard at all — filling in a name and pressing Next —
still wrote a `status = 'draft'` row to `media_core.playlists` on the very first step change,
before the operator had asked for anything to be saved.

That auto-create-on-Next behavior had two costs. First, `media_playlists_list` carried `AND
pl.status <> 'draft'` (ADR 0012) to keep those rows out of both the `/playlists` page and the
publication content picker — meaning every abandoned wizard, including ones closed after a single
keystroke past step 1, left an invisible row in production with no UI path to see or discard it.
Second, and reported directly as a bug: the resume-prompt banner ("continue where you left off?")
read live draft-store state to decide whether to show itself. Because `goNext` wrote a server
draft on the very first step transition, and the store's "has content" check fired on that same
state, the prompt could trigger on the first keystroke of a brand-new playlist — asking the
operator whether to resume work they had not yet created.

This ADR separates two things that had been folded into one mechanism: preserving in-progress
work so a refresh or a closed tab does not lose it, and creating a playlist record the operator
can see, return to, and publish from `/playlists`. `usePlaylistDraftStore.ts` already persists the
wizard to `localStorage` on every change, independent of any server call — that persistence was
never the problem. The problem was that walking the wizard also silently created a server-side
draft as a side effect of navigation.

## Decision

**`goNext` no longer calls `persistDraft`.** Advancing from step to step now only validates the
current step and calls `draft.setStep(step + 1)` — a local, `localStorage`-backed state change,
identical in kind to typing into a field. No network call happens, and no server row is created,
purely from moving through the wizard. This supersedes ADR 0012's "draft row created on first
Next from the info step" and the auto-save framing ADR 0013 built on top of it: `persistDraft`
is not the mechanism that makes Save Draft meaningful, because Save Draft is now the only
step-wizard path that calls it at all — alongside the final submit, which calls the same function
with `activate: true`.

**A server-side draft now exists only because the operator asked for one.** Pressing Save Draft,
or completing the wizard through final submit, are the only two events that write to
`media_core.playlists`. Auto-save and draft-creation are drawn as two different concerns:
auto-save's job is that leaving the page and coming back does not lose typed-in work, and it is
satisfied entirely by the existing `localStorage` persistence in `usePlaylistDraftStore.ts`. Draft
creation is a deliberate act with a server row, a `status = 'draft'` value, and a place in the
`/playlists` list. Conflating the two, as ADR 0012 did, meant every abandoned wizard — including
ones the operator never intended to keep — wrote an invisible row to production, and it left Save
Draft with no observable effect of its own: the row already existed by the time the button was
pressed.

**Rejected: an `explicitly_saved` boolean column**, mirroring the flag publications carries. Under
that design, the row would still be created on first Next as before, but marked
`explicitly_saved = false` until Save Draft (or final submit) flips it, and `media_playlists_list`
would filter on the flag instead of on `status`. This has one real advantage the on-demand model
gives up: it survives a browser change or a different device recovering the same in-progress
draft, which pure `localStorage` cannot do. It was declined anyway, for two reasons. It needs a
new column and a migration, where the on-demand model needs none — `goNext` simply stops calling
an RPC. And it does not remove the cost this change exists to remove: every abandoned wizard still
writes to production the moment the operator types a name and clicks Next, exactly the behavior
under scrutiny here, just relabeled instead of avoided. Cross-device draft recovery is a real
capability, but nobody asked for it; paying for it now would mean keeping the exact write pattern
this ADR removes.

**Accepted consequence: work not yet saved with Save Draft lives only in the browser that typed
it.** If the operator fills in three steps of a new playlist, never presses Save Draft, and clears
site data (or the tab crashes before `localStorage` flushes, or they switch machines), that work
is gone with no server copy to fall back to. This is the same guarantee the wizard had before the
draft-save work started — ADR 0012 introduced the stronger guarantee as an explicit goal ("data
loss on refresh/crash during a long edit"), and this ADR narrows it back: refresh and tab-crash
recovery still work, because `localStorage` survives both, but the guarantee no longer extends to
a fresh browser or a cleared profile. Save Draft is the operator's way to promote local-only work
into something that survives that; it does not run automatically on their behalf.

**`media_playlists_list` gains an opt-in `p_include_drafts` parameter rather than dropping the
`status <> 'draft'` filter.** One RPC already serves two callers with opposite requirements: the
`/playlists` management page, which must now show drafts (the whole reason to make Save Draft
observable), and the publication content picker, which must never offer an unfinished playlist as
schedulable content. A single shared function cannot satisfy both by always including drafts or
always excluding them, so the caller states its intent. The parameter defaults to `false`
specifically so a caller that forgets to pass it — an existing route, a new route added later, a
frontend call site added without checking this ADR — fails closed into the safer behavior
(drafts hidden) rather than failing open into leaking an in-progress playlist onto a live screen.
Migration `087_playlists_list_include_drafts.sql` implements this as `DROP FUNCTION IF EXISTS
public.media_playlists_list(p_tenant_id uuid)` followed by `CREATE OR REPLACE` with the new
two-argument signature — the explicit `DROP` is required because adding a parameter to an existing
function via `CREATE OR REPLACE` alone creates a second overload instead of replacing the first,
leaving every existing single-argument call site ambiguous (the same trap ADR 0003 and ADR 0012
both recorded). On the frontend, `fetchPlaylists(includeDrafts = false)` mirrors that default: the
`/playlists` page passes `true`, the publication content picker's call is left at the default and
passes nothing.

**The resume-prompt bug is fixed structurally, not by patching the trigger condition.** The
decision of whether to show "continue where you left off?" is factored into `shouldShowResumePrompt`
(`resume-prompt.ts`), a pure function that only looks at whether the draft had content *at the
moment the store rehydrated* — captured once into a ref on first render — never at its current,
live contents. Reading live state was exactly what made the prompt able to fire mid-keystroke on a
brand-new playlist: any state change, including the first character typed, could flip the
condition true between renders. Freezing the answer at hydration time makes the function blind to
everything that happens afterward, so a keystroke on a new playlist can no longer reopen the
question the operator already answered by starting one.

## Consequences

`goNext` and Save Draft are no longer the same mechanism wearing two names, as ADR 0013 described
them; they are now genuinely different actions, and only one of them touches the network. A future
change to what a save cycle writes still only has to change `usePlaylistDraftSave.persistDraft`,
since Save Draft and final submit both call it — but `goNext` no longer participates in that
contract at all, and adding a fourth caller of `persistDraft` would need its own deliberate
decision about whether it belongs on the same "operator asked for this" side of the line.

`media_playlists_list` now has to be read with its second argument in mind at every call site,
forever — a new caller that forgets `p_include_drafts` gets a working, safe answer (no drafts)
that will nonetheless look like a bug report the first time someone expects to see a draft there.
The default was chosen deliberately to fail this way rather than the other, but it is still a
sharp edge future call sites must remember.

This narrows, but does not close, the gap ADR 0012 and ADR 0013 both already recorded: there is
still no `media_playlist_delete` RPC and no Cancel button in the wizard, so a draft saved with
Save Draft and then abandoned sits in `status = 'draft'` permanently with no way for the operator
to remove it. What changes here is severity, not existence — that gap now only applies to rows the
operator deliberately created and can see and act on from `/playlists`, instead of to every wizard
session that ever reached step 2, visible nowhere. Both remain deferred backend work, unstarted by
this change.

Migration `087_playlists_list_include_drafts.sql` is written but was deliberately not applied to
any database as part of this change — applying it is a separate, explicit production step. Until
it is applied, `/playlists`'s `include_drafts=true` request hits the old one-argument RPC, and the
frontend code that depends on the new parameter cannot be exercised end-to-end.
