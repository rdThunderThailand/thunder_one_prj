# Frontend answers to Core's response

> Written 2026-08-28 · Replying to `core-response-people-workspace-api.md` (same date)

## §8 Q4 — Fixed or variable onboarding/offboarding steps?

**Fixed global template.** One hardcoded list of 9 onboarding steps + 10 offboarding steps for
every hire/departure, exactly matching what's already built and shipped in the frontend mock data
(`people/new-hires`'s and `people/departures`' `mock-data.ts`) — no per-unit/position/exit-type
variation. Simplest schema on your side (an enum or a static list is enough, no template +
checklist-item table needed), and it matches what's already live.

If a real need for per-unit variation shows up later (e.g. Engineering wanting an extra
dev-environment-setup step), that's a schema migration to revisit then — not something to design
for speculatively now.

## §8 Q1 — Member Type: closed enum or lookup table?

No objection to your recommendation — **closed enum** (`employee`/`contractor`/`partner`/`guest`),
matching the reference diagram. We don't know of a broader partner/vendor taxonomy elsewhere in
Thunder One that this would need to reconcile with; if one turns up later, that's also a
revisit-then problem, not a block now.

## Everything else in your response

No objections — proceed on P1/P2 as described (extending the existing `members`/`organizations`
endpoints rather than new People-specific tables), and on the P6/P7 "one `content_items` schema"
lean for Policy/Knowledge Base. `fillRate`'s formula (§8 Q6) stays open on both sides; we'll come
back to it once someone on the business side can define it — not blocking P1–P5 in the meantime.
