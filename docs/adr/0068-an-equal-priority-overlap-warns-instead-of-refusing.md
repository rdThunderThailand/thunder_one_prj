# An equal-priority overlap warns instead of refusing

**Status:** accepted (2026-09-09)

Publishing is never blocked by a schedule overlap. Every overlap — higher, equal or lower priority,
Composition or flat — is a warning shown on the Schedule and Review steps, and Publish stays
enabled. Playback, not activation, decides what a screen shows: publications sharing the top
priority tier merge into one loop while all of them are flat, and the moment any of them carries a
Layout the most recently activated one takes the screen alone until the overlap ends. This
supersedes ADR 0044 §8 and the conflict gate of ADR 0040; the priority-override behavior both
describe is unchanged.

## Why the refusal was worse than the overlap

Refusing the overlap did not remove the operator's need to change what is on screen right now. It
forced a sequence: cancel the publication that is airing, then build and publish its replacement.
Between those two steps the device polls and finds nothing in window — the screen goes black for as
long as the operator takes. Allowing the overlap reverses the order: publish the replacement first,
then cancel the old one, and the screen never has an empty window.

ADR 0044 §8 was right that one poll response cannot represent two Layouts airing at once. It was
wrong to conclude that activation should refuse the situation; the response only has to be
_defined_, and picking the most recently activated Publication defines it.

## Considered options

- **Append the two in time (a `compositions[]` payload):** rejected for now. It is the honest fix
  and ADR 0044 §9 already sketches the shape, but it changes the wire contract and needs matching
  player work — weeks, not a hotfix, while the black screen is happening today.
- **Composition always wins the screen:** rejected. An operator who publishes a flat playlist over
  a live Composition would see publish succeed and the screen not change, which is more confusing
  than being refused.
- **Earliest activation wins:** rejected for the same reason — a newly published item that does not
  air reads as a bug.
- **Lift the refusal and leave `media_job_poll` alone:** rejected. Both sides' Zones would be
  aggregated into one `zones[]` and the branch key (`layout_id` off the first slot) would flip with
  activation order, so the same overlap renders differently from one poll to the next.
- **Most recently activated Publication takes the screen (chosen):** it matches what the operator
  just did, it is deterministic, and it leaves the all-flat merge — the common case, and the one
  operators already rely on — byte for byte as it was.

## Consequences

`media_publication_activate` no longer raises on an equal-priority overlap. `media_job_poll` gains a
winner rule that only fires when a Layout is in the top tier. `media_schedule_conflicts` is
unchanged: its `blocks` field still correctly identifies overlaps that cannot share a screen, and
only its consequence changed, from refusal to warning — the frontend reads it as
`exclusiveOverlapCount` and says so in the warning copy.

Publish eligibility gates on the draft's own completeness only (content, schedule, channels). It no
longer waits for the conflict result, so a slow or failing `media_schedule_conflicts` degrades to
"overlaps could not be listed" rather than a dead button.

A Publication can now be active, in window, and not airing. Operators are told this at publish time,
but nothing on the Publications list distinguishes "active" from "actually on screen" — Now & Next
already answers that question and is where the distinction belongs if it needs surfacing.
