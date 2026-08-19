# 0015 — Publications: an Inactive tab for ended/cancelled, and duplicate-to-draft

## Context

ADR 0004 gave `media_core.publications` a derived `effective_status` (`scheduled` / `active` /
`ended`, layered on top of the three stored values `draft` / `active` / `cancelled`) and made a
deliberate choice about how the list page uses it: *"The Publications page has a `Drafts` tab and
an `Active` tab and no `Ended` tab; filtering on the derived value would make expired publications
vanish from the UI entirely."* That decision held the `Active` tab's meaning at "activated and not
cancelled" and left every scheduled, currently-airing, and long-expired publication in one list,
distinguished only by a status badge (`publicationDisplayStatus`,
`src/features/publications/publication-status.ts`).

`status = 'cancelled'` is a separate case ADR 0004 did not address for the list page at all.
`fetchPublications` (`src/features/publications/services/publications-api.ts:105-107`) only ever
accepts `"draft" | "active"` — there is no call site, today, that requests `status=cancelled`.
Cancelled publications are written (via `cancelPublication`,
`publications-api.ts:133-134`) and are readable through `fetchPublication(id)` for a single row,
but there is no page that lists them. A cancelled publication is invisible in the UI from the
moment it is cancelled.

The operator now wants three things: expired and cancelled publications visually separated out of
the working `Active` list; a duplicate action on an ended or cancelled publication that seeds a new
draft from it, so a lapsed schedule can be relaunched on a new screen or a new window without
rebuilding the playlist from scratch; and, initially, a way to bulk-delete old entries. The last of
those was withdrawn once the schema was checked: `media_core.publications` has no soft-delete
column anywhere (`deleted_at`, `is_deleted` — neither exists on any table in this schema), and the
one delete path that does exist, `media_publication_delete`
(`061_media_publication_manage.sql:60-89`), only permits `status = 'draft'`, hard-deleting the row
and its auto-owned playlist. A publication that ever reached `active` is a broadcast record —
Thunder needs to answer "what aired on this screen, and when" after the fact — so extending hard
delete to ended or cancelled rows would make that record unrecoverable. No archive/soft-delete
column was proposed as an alternative for this change; it is out of scope here and left for
whoever needs it.

`media_core.publications.playlist_id` (`048_media_core_schema.sql:102-109`) has no `UNIQUE`
constraint but is treated as a 1:1, auto-owned relationship: `media_publication_delete`'s own
comment describes it as deleting "draft publication and auto playlist," confirming each publication
owns exactly one playlist rather than sharing one. That matters for duplication: copying a
publication means copying its playlist and every item in it, not just publication-row metadata.

## Decision

**A third tab, "Inactive," is added next to "Active" alongside the existing `Drafts` tab.** It
shows every publication where `effective_status === 'ended'` (from the existing `active`-status
fetch) or `status === 'cancelled'` (from a new fetch, since no call site requests that status
today). `fetchPublications`'s signature widens from `"draft" | "active"` to `"draft" | "active" |
"cancelled"` to allow the second query; the two results are merged client-side into the Inactive
tab's rows. `Active` keeps its ADR 0004 meaning unchanged: `effective_status` of `scheduled` or
`active` only. No backend query, RPC, or migration changes for this part — `media_publications_list`
already returns `effective_status` and `status` on every row (ADR 0004), and the list has no
pagination to worry about losing rows across (`publications-api.ts:105-123` takes no
limit/offset). This reverses ADR 0004's tab arrangement but keeps its stated intent — "don't make
expired publications vanish" — intact: nothing disappears, it moves to a second tab instead of
being color-coded inside the first one.

**Bulk-delete is not built.** Thunder needs ended and cancelled publications to remain queryable as
broadcast history; a hard-delete path (the only kind this schema has) would destroy that history
permanently, and no soft-delete/archive mechanism exists to make deletion reversible. The Inactive
tab is read (and duplicate-from) only. If a bulk-remove or archive need shows up later, it requires
its own design pass — most likely a new `archived_at` column and a decision about who can query
past it — not an extension of `media_publication_delete`.

**Duplicate is available from the Active and Inactive tabs, not from Drafts.** A draft has nothing
worth copying that "start a new one" doesn't already give; duplicate exists specifically to relaunch
a publication that already has a real, populated playlist, targets, and schedule shape behind it.

**Duplicate creates a full copy in one transaction and lands the operator in the edit flow for it,
rather than deferring creation until Save.** This was the one point walked back mid-session:
deferring creation (holding the copied playlist, its items, targets, and schedule as client-only
state until an explicit save) was the first instinct, by analogy with ADR 0014's "don't write
until asked." It does not transfer here. ADR 0014's premise was that the wizard usually starts from
nothing, so there is nothing at risk in delaying the write. Duplicate never starts from nothing — it
starts from a playlist that may hold many items, and holding that copy unpersisted in
`localStorage`/component state through a multi-step wizard reintroduces exactly the class of bug
ADR 0014 had just finished removing: a second, ad hoc "what does the draft contain" source that the
resume-prompt and hydration logic would need to account for, on top of the real-draft and
blank-new-playlist cases it already handles. A single duplicate RPC — insert the new playlist, copy
its items, insert the new publication row with copied targets and schedule shape, all in one
transaction — avoids that entirely and costs one orphan-draft risk if the operator abandons it
unsaved, which is the same risk every other draft already carries.

**The copy clears `starts_at`/`ends_at` to null and appends `" (Copy)"` to the name; everything
else — playlist items, `PublicationTarget` rows (screen/device), and the schedule's recurrence/
timezone shape — is copied as-is.** An ended publication's dates are, definitionally, in the past;
carrying them forward as the new draft's default risks the operator publishing on a schedule they
never meant to set, since "duplicate to change the screen or the time" was the request that started
this. The name suffix is a lightweight guard against confusing the copy for the original in a list
that will now show both.

## Consequences

`fetchPublications` gains a third accepted value and the Inactive tab issues two requests
(`active`, filtered to `effective_status === 'ended'`, and `cancelled`) instead of one — a caller
adding a fourth tab or a different cross-status view later will find the same two-query merge
pattern already established here rather than a single filterable endpoint.

Publications page now has three tabs whose membership rules live in three different places: `Drafts`
reads stored `status` directly, `Active` reads `effective_status` (ADR 0004), and `Inactive` reads
both `effective_status` and `status` depending on which query the row came from. A future reader of
`PublicationsListPage.tsx` has to know this split; it is not self-evident from the tab labels alone.

No delete or archive path exists for ended/cancelled publications after this change, same as
before it — the list will keep growing with no ceiling, since the underlying fetch is still
unbounded. That was already true pre-ADR; this change makes the accumulation more visible (a
dedicated tab for it) without addressing it. Revisiting pagination or an archive mechanism is
future, undecided work.

Duplicate adds a second write path that creates a `status = 'draft'` publication with a
freshly-copied playlist, alongside the wizard's own Save Draft. Both are now capable of producing an
abandoned draft with no cleanup path (`media_publication_delete` still only fires from the wizard's
own draft-discard action, if any exists) — duplicate does not add a new category of risk here, it
uses the one drafts already carry.
