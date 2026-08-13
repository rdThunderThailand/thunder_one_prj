# 0004 — Publication lifecycle status is derived, not stored

## Context

`CONTEXT.md` defines a five-value Publication lifecycle: `Draft` → `Scheduled` → `Active` →
`Ended` | `Cancelled`. Production only ever contains three of them.

Verified on prod 2026-08-05:

- `media_core.publications.status` holds only `draft`, `active`, `cancelled`. **Nothing has ever
  written `scheduled` or `ended`.** The column has no CHECK constraint — it is free text.
- `media_publication_activate` sets `status = 'active'` unconditionally, without comparing
  `starts_at` to the clock. Activating a publication scheduled for next week marks it `active`
  immediately, when the glossary says `Scheduled`.
- Nothing ever moves a publication out of `active`. `pg_cron` is installed and runs two sweeps
  (`booking_expire_holds`, `media_sweep_device_offline`) — neither touches publications. 4 of the
  5 `active` publications on prod are past their `ends_at`.

**Devices are unaffected, and that is the decisive fact.** `media_job_poll`
(`069_media_poll_window_conflicts_and_airtime_report.sql:71-80`) gates on the stored status *and*
independently on the clock:

```sql
AND pub.status = 'active'
AND now() >= s.starts_at
AND (s.ends_at IS NULL OR now() < s.ends_at)
```

A publication stops playing the moment its window closes regardless of what `status` says. The
schedule window — not the status column — is already the authority on timing. The bug is confined
to what operators are shown in the Publications list and detail pages.

The frontend already derives an airing state this way: `classifyPublicationAiring`
(`src/features/publications/schedule.ts`) computes `live` / `next` / `ended` from the schedule and
drives Overview's "Now & Next". That derivation is correct and unaffected — it is simply not
available to the list page, which reads `status`.

## Decision

**Keep the stored `status` column as the record of irreversible operator intent, and derive the
full five-value lifecycle at read time.**

Stored `media_core.publications.status` continues to hold exactly three values, each recording
something a human did that cannot be inferred from a clock:

| stored | means |
|---|---|
| `draft` | created, never activated |
| `active` | activated, not cancelled |
| `cancelled` | stopped by an operator |

A new `media_core.publication_effective_status(status, starts_at, ends_at, at)` helper derives the
displayed lifecycle, and `media_publications_list` / `media_publication_get` return it as
`effective_status` alongside the raw `status`:

```
cancelled                                → 'cancelled'   (terminal, outranks the clock)
draft                                    → 'draft'
active AND at <  starts_at               → 'scheduled'
active AND ends_at IS NOT NULL AND at >= ends_at → 'ended'
active otherwise                         → 'active'
```

**Rejected — a `pg_cron` sweep that flips `scheduled`→`active`→`ended` on the wall clock.** It
matches the glossary literally and makes the column self-describing to anyone querying the DB
directly, but it stores a second copy of a fact the schedule already carries. That is precisely
the failure mode this codebase hit earlier the same day, when a migration rewrote
`media_publication_get` from a stale source and two representations of the same data silently
diverged. It also carries a staleness window equal to the sweep interval, needs `activate` to
start writing `scheduled`, and needs a backfill for existing rows. Derivation has none of those.

**Rejected — accept the current behaviour and only document it.** The list page would still have
no honest status to show, and `CONTEXT.md` would stay wrong.

**Recurrence is deliberately ignored by this derivation.** A weekly publication that runs Mon–Fri
is `active` on a Saturday: its *run* is ongoing, it merely is not on screen at this instant.
"On screen right now" is a different question with a different answer, and
`classifyPublicationAiring` remains its only owner. Collapsing the two would make the list page
claim a Mon–Fri publication had `ended` every weekend.

**The `p_status` filter keeps matching the stored value.** The Publications page has a `Drafts`
tab and an `Active` tab and no `Ended` tab; filtering on the derived value would make expired
publications vanish from the UI entirely. The `Active` tab therefore keeps meaning "activated and
not cancelled", with each row now labelled by its `effective_status`.

**`media_job_poll` is not changed.** Its `status = 'active'` test keeps meaning "activated and not
cancelled", which is exactly what it needs; the window check beside it already handles timing.

Behavioural gates in the UI (which buttons appear) stay bound to the stored `status` —
whether a publication can be edited or cancelled follows from whether it was activated, not from
whether its window has closed. Only the displayed label changes.

## Consequences

`status` and `effective_status` are both present in API responses and mean different things. Any
new consumer deciding "what phase is this publication in" must read `effective_status`; anything
asking "did an operator activate this" reads `status`. The RPCs are the only place the derivation
lives — a caller recomputing it from `starts_at`/`ends_at` inline reintroduces the drift this ADR
exists to prevent.

The derivation is clock-dependent, so `effective_status` is only true as of the response. A page
left open overnight will show a stale label until it refetches. This is accepted: the same is
already true of Overview's airing state, and no decision is made from the label.

`CONTEXT.md`'s five-value lifecycle now describes `effective_status`. The stored column is a
three-value subset, documented as such.
