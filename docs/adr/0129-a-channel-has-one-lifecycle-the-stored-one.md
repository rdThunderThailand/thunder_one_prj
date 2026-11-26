# 0129 — A Channel has one lifecycle: the stored one

Status: accepted (2026-11-25, owner decisions in chat, grill rounds 1–2; §4 re-decided after the
scrutiny round).
**Workspace:** media
**Amends:** ADR 0037 *One status, three values, derived* (One no longer shows or filters on the
derived value); ADR 0099 §4 (pickers read the one remaining field, through one predicate).
**Relates to:** GitHub #463 (this decision), #464 (architecture review round 2); ADR 0122 rules 3, 4
and 17 (lifecycle actions and problem targets already follow the stored value); ADR 0084 §6 (Disabled
Groups stay selectable in the scope picker); ADR 0125 (status badge vocabulary).

## Context

`ChannelListItem` (`src/features/media-workspace/channels/types/index.ts`) carries two fields of the
same type `ChannelLifecycle = "draft" | "active" | "inactive"`:

- `status`: the stored `media_core.channels.status`, added by ADR 0099. It is the only field that tells
  you a Channel was deactivated, and only `active` may be a Program target.
- `lifecycle`: derived in Core `media_core.channel_rows` (ADR 0037).

Every caller picks one field for itself, and two fixes in a row came from picking the wrong one:
9184c10e (Programs reach only active Channels) and 9fe633e3 (lifecycle actions follow the stored
status).

Checked in Thunder_Core on 2026-11-25 (`origin/develop` last definition
`20261122090652_channel_tombstone_guards.sql`, `origin/main` `20261026235959_baseline_from_prod.sql`;
same derivation, and develop also hides Tombstones). The derived value is:

```
status = 'draft'                                              -> draft
status = 'active' AND count(publication_targets of type
         'channel' naming this Channel) > 0                   -> active
otherwise                                                     -> inactive
```

The count covers every Program status (Draft, Ended and Cancelled included) and skips Group targets. So
derived `active` does not mean "carrying content right now", which is what ADR 0037 says it means:

- a Channel whose only Program ended long ago shows Active;
- a Channel that airs through a Group shows Inactive;
- a committed Channel nothing has named yet shows Inactive, the same as a deactivated one.

"Is this Channel on air" is answered elsewhere: by Now & Next, and by `blocking_programs` on the detail
endpoint ("in use", ADR 0122 rule 7).

On `dev` @ cf6e195f:

- **Readers of the derived `lifecycle`:**
  - the detail badge (`ChannelDetailPanel.tsx`);
  - the list's Lifecycle filter (`channel-logic.ts` `filterChannels`, `ChannelFiltersBar.tsx`, URL
    `?lifecycle=` in `list-url-state.ts`);
  - `ChannelScopePicker.tsx`, which supplies the scope for Now & Next, Calendar and Playback Proof.
- **Readers of the stored `status`:** seven places (both target pickers, problem targets, lifecycle
  actions, the row menu, the editor's no-Player option and the create success card).
- **Unused:** `ChannelListQuery.lifecycle` (`?lifecycle=` on `GET /media/channels`) has no caller. If
  it were sent, Core would filter on the derived value.

The glossary already names the stored value. `CONTEXT.md` **Channel**: "Its lifecycle is
`Draft → Active ↔ Inactive`". *Status* is the Player's health (ADR 0074 §4), which the code reflects in
`channelStatus()` and `ChannelStatusFilter`.

## Decision

1. **One lifecycle field, holding the stored value.** `ChannelListItem` has one field,
   `lifecycle: ChannelLifecycle`, read from Core's `status` key. The `status` field is removed.
   Core's derived `lifecycle` key is no longer read (`publication_count` never was); the parser
   neither requires nor checks it. The name follows the glossary, and it keeps `status` meaning Player health
   in the Channel screens.
2. **One predicate for the ADR 0099 rule.** `canBeProgramTarget(channel)` in
   `channels/lifecycle-actions.ts` returns `channel.lifecycle === "active"`. The three places that
   apply the rule call it: `toChannelItems`, `targetableChannels` and `selectedProblemTargets`. Other
   questions ("is it a Draft", "was it deactivated") compare the field directly, because there is no
   longer a wrong field to pick. `lifecycleActionsFor` and `ChannelLifecycleActions` rename their
   `status` input to `lifecycle`.
3. **The badge and the list filter show the stored lifecycle.** Active means "the operator committed
   it and it can be targeted", the same as the Layout and Template badges in ADR 0125. It no longer
   means "a Program names it". Labels, colours, filter values and the `?lifecycle=` URL key stay as
   they are, so old links still open.
4. **The scope picker offers what the screen's Core read accepts.** `ChannelScopePicker` gains
   `includeInactive?: boolean` (default `false`):
   - **Now & Next and Calendar** (default) list Active Channels only. Core's `media_now_next_get` and
     `media_calendar_get` refuse a Channel whose stored `status <> 'active'` with "not found", and both
     screens then show "That Channel no longer exists" and fall back to All Channels. Today the picker
     lists deactivated Channels there, so picking one fails that way.
   - **Playback Proof** passes `includeInactive`. Core's `playback_proof_check_args` accepts any
     status ("proof outlives a Channel being disabled"), so a deactivated Channel stays selectable for
     its history. It is marked with the hint "Inactive", the same pattern as the "Disabled" hint on
     Groups.
   - Draft Channels are never listed (a Draft never airs, so it has neither schedule nor proof).
   - The "All Channels" count is the number of Active Channels on every screen. That matches Now &
     Next's own `v_total_active_channels`.
5. **`?lifecycle=` leaves the list request.** `ChannelListQuery.lifecycle` and its search param in
   `buildChannelListPath` are removed. Filtering stays client-side.
6. **Core is not changed.** `channel_rows` keeps emitting `lifecycle` and `publication_count`, and
   keeps its `p_lifecycle` parameter. One reads none of them. Remove them the next time Core changes
   `channel_rows` for another reason. Dropping the two keys is a `CREATE OR REPLACE` with the same
   signature, and dropping `p_lifecycle` is a `DROP`+`CREATE` with re-grants. Either way it is a
   cross-repo migration (R0) that users would not notice.

## Considered options

- **Keep both, with distinct types and names** (for example `airing` for the derived value). Rejected:
  the derived value is wrong as "on air" (it counts ended Programs and skips Groups). Making it right
  needs a Core change to `channel_rows` across two repos, and no caller needs it.
- **Add only question functions and leave both fields.** Rejected: the two fields would keep the same
  type, so the next new caller could still read the wrong one. That is the failure #463 is about.
- **Name the one field `status`.** Rejected: it clashes with the glossary (status is Player health)
  and with `channelStatus()` / `ChannelStatusFilter`.
- **A new name such as `stage`.** Rejected: tsc would flag every reader, but the word is not in the
  glossary. Only three readers change meaning silently, and all three are changed on purpose in the
  same PR.
- **A predicate per question** (`isDraft`, `isDeactivated`). Rejected: each would only compare one
  enum value and would not survive the deletion test. Only the targeting rule has an ADR behind it
  and a chance to grow (Tombstones, ADR 0122).
- **Scope picker lists every non-Draft Channel on every screen, with an "Inactive" hint.** This was the
  first round-1 answer. It was reversed after review: Now & Next and Calendar refuse a non-Active
  Channel, so the hint would advertise a choice that fails.
- **Scope picker lists only Active Channels on every screen.** Rejected: Playback Proof could no longer
  scope to a deactivated Channel, although Core serves its proof.
- **Make Core's Now & Next and Calendar accept any status.** Rejected: a cross-repo change (R0) for
  little gain. Calendar reads only `p.status = 'active'` Programs, and Deactivate is refused while a
  Program is live or scheduled, so a deactivated Channel has almost nothing to show there.
- **Open a Core issue to drop the derived key now.** Rejected for now (decision 6).

## Consequences

- No screen in One shows "has a Program" as a Channel state. An operator who wants "is it on air" uses
  Now & Next, or the in-use lock on the Channel detail.
- The detail badge and the Lifecycle filter change for one case only. A Channel that is stored
  `active` but that no Program names directly (never targeted, or targeted only through a Group) now
  shows Active; before, it showed Inactive. Draft, deactivated, and directly targeted active Channels
  show the same as before, because derived `active` already required stored `active`.
- A pre-ADR-0099 Core that sends no `status` key already failed to parse (9184c10e made it required).
  Nothing changes there.
- Program-detail targets (`PublicationTarget.status`, ADR 0122 rule 17) are a separate snapshot that
  Core names `status`. It has one meaning (the stored value) and is out of scope.
- Not covered: the Channel Group member pickers (`channel-groups/`) do not read the lifecycle at all,
  so they offer non-Active Channels that Core then refuses (ADR 0099 §2). That is a separate gap; if
  it is fixed, it should call `canBeProgramTarget` or a sibling predicate next to it.
