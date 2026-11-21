# 0122 — Deleting an unused Channel frees its Player; a Channel with history becomes a Tombstone

Status: accepted (2026-11-20, owner decisions in a grilling session on "move a Player to a new Channel
and delete the old one"; scrutiny round 1 applied the same day).
**Workspace:** media-workspace

Supersedes the hard-delete rule of [ADR 0038](0038-channel-lifecycle-retirement-and-concurrency.md)
("`activated_at` is the retirement evidence") and its rejected option "Soft-delete every Channel".
Amends [ADR 0037](0037-channel-status-derived-from-publications.md) (Deactivate is no longer the only
lifecycle button) and [ADR 0074](0074-channel-one-player-and-channel-group.md) §1 (an Inactive Channel
may be Player-less). Keeps [ADR 0099](0099-programs-reach-only-active-channels.md)'s rule that Group
edits are explicit. The reservation table of ADR 0030 is unchanged.

## Context

An operator created a Channel, gave it a Player, then wanted that Player in a new Channel and the old
Channel gone. Neither step is possible:

- The wizard commits every Channel as `status = active` with `activated_at` set
  (`channel-write-api.ts` sends `as_draft: false`), so the Player is reserved at once.
- ADR 0037 derives `lifecycle = inactive` for a stored-active Channel with no Program. The Lifecycle
  card then renders nothing (`ChannelLifecycleActions.tsx`, `if (lifecycle === "inactive") return null`)
  and the list row's "Disable Channel" is disabled ("Channel is not active"). Core's
  `media_channel_deactivate` would accept the Channel; only the screen hides the action.
- The Player picker can only select, never clear. In the new Channel's picker the device shows
  "In use by <old Channel>".
- `media_channel_delete` refuses unless `status = 'draft' AND activated_at IS NULL`. Since ADR 0037 every
  created Channel carries `activated_at`, so the rule no longer separates "ever real" from "never used";
  it separates Drafts from everything else.
- The FE has no Activate button, so a Draft could never go live from the UI either.

Measured read-only on ThunderCore prod on 2026-11-20:

| Stored status | Holds its Player | Ever targeted by a Program | Channels |
|---|---|---|---|
| active | yes | no | **72** (stuck as above) |
| active | yes | yes | 70 (8 of them only by Draft or Cancelled Programs) |
| inactive | no | yes | 1 |

Of the 72, **68** have no Program target, no Group membership, no row in
`publication_snapshot_group_members` and no `playback_logs`. The other 4 have playback logs.

Foreign keys to `media_core.channels`: `channel_devices`, `channel_device_reservations`,
`channel_group_members` and `publication_targets` are `ON DELETE CASCADE`; `playback_logs.channel_id`
is `ON DELETE SET NULL` (41 Channels have logs, 1.67 M rows), and the daily rollup keys on `channel_id`
forever (Core ADR 0030). A hard delete of a Channel with history would therefore silently drop targets
from Programs and strip the Channel from Playback Proof. For a Channel with none of those rows it
removes nothing but its Player link and reservation.

Gaps found on the way:

- Deactivate already refuses a Channel that is in any Group (`media_channel_deactivate`, ADR 0099 §3),
  so Deactivate cannot strand a live Group Program. Changing the Player can:
  `channel_set_devices` checks `channel_blocking_publications`, which counts only
  `target_type = 'channel'` rows.
- `media_channel_groups_set_members` can remove a member while the Group's Program is live. That
  Channel stays in `publication_snapshot_group_members` and its device keeps receiving the Program's
  Jobs. Prod has 6 Channels that sit in a snapshot but no longer in the Group.
- The PATCH route sends `p_player_id: input.player_id ?? null` and `media_channel_update` passes it
  straight to `channel_set_devices`. A PATCH without `player_id` on an Active Channel with no live
  Program removes its Player and reservation and leaves an Active Channel with no Player. The UI cannot
  send that today because the picker cannot clear.

## Decision

### Shared rules

1. **In use** means a Program whose effective status is Active or Scheduled reaches the Channel by any
   of: a direct target; a Group target the Channel currently belongs to; the Channel's row in that
   Program's newest `publication_snapshot_group_members`. It is not the Player's heartbeat or what is
   playing right now: a Player idle between two scheduled slots is still in use.
   `channel_blocking_publications` gains the two Group paths, so Delete and changing the Player share
   one check.
2. **Delete refuses a Channel that is in a Group**, naming the Groups, with the same rule and wording as
   Deactivate. Group edits stay explicit (ADR 0099).
3. **Lifecycle actions follow stored status, not the derived badge.** Deactivate shows for
   `status = 'active'`; Activate shows for Draft and Inactive and is disabled until a Player is set;
   Delete shows for every live Channel. The derived badge of ADR 0037 stays as the display label.
4. **Removing the Player needs Deactivate first.** The picker offers "No player yet" only for Draft and
   Inactive Channels. Core adds the matching guard: `media_channel_update` refuses a null Player on an
   Active Channel.
5. **While the Channel is in use, the Player is locked and the screen says why before Save.** Core
   returns the blocking Programs with the Channel detail. The editor shows a persistent notice naming
   them (linked), disables the picker, Deactivate and Delete, and repeats the list in their tooltips.
   Swapping a Player under a live Program is not supported (see options).
6. **The wizard can save a Channel without a Player.** With no Player picked, the last button reads
   Save as Draft and sends `as_draft: true`; with a Player it still creates an Active Channel.
7. **Feedback** follows [ADR 0123](0123-success-is-a-toast-failure-stays-inline-decisions-are-dialogs.md).

### Phase 1 — hard delete of a Channel that has never been used

8. `media_channel_delete` accepts any status when the Channel has **no** `publication_targets` row, no
   `channel_group_members` row, no `publication_snapshot_group_members` row and no `playback_logs` row.
   The cascade then removes only `channel_devices` and the reservation, so the Player is free at once.
   The checks run **after** the `FOR UPDATE` lock in `channel_lock`: any concurrent insert into those
   tables takes a `FOR KEY SHARE` lock on the Channel row through its foreign key, so it either waits
   for the delete or is seen by the checks. The refusal names what holds the Channel.
   `playback_logs` has no index on `channel_id` (prod, 2026-11-20), so both the check and the existing
   `SET NULL` action scan all 1.67 M rows; the same migration adds a partial index
   `(channel_id) WHERE channel_id IS NOT NULL`.
9. The delete dialog states which Player becomes free and "This can't be undone."
10. Phase 1 ships rules 1–7 with it. It covers 68 of the 72 stuck Channels; the rest can be deactivated.

### Phase 2 — Tombstone for a Channel with history

Phase 2 starts only after items 14–16 are in place.

11. **Delete of a Channel that is not in use but has history is a Tombstone.** One transaction: set
    `deleted_at` and `status = 'inactive'`, and delete its `channel_device_reservations` and
    `channel_devices` rows. The Channel row stays, so `publication_targets`, Playback Proof and the
    rollup still resolve its name. There is no undo: the Player may already be reserved elsewhere.
12. **A deleted Channel is out of every live surface.** Lists, counts, pickers (Program targets, Group
    members, Player candidates), the calendar and Now & Next filter `deleted_at IS NULL`. History screens
    show `<name> (deleted)`. The 24 Core functions that read `media_core.channels` on prod on 2026-11-20
    are each checked: `channel_audit`, `channel_group_rows`, `channel_lock`, `channel_rows`,
    `channel_set_devices`, `playback_proof_check_args`, `playback_proof_rows`,
    `publication_group_warnings`, `media_calendar_get`, `media_channel_activate`, `media_channel_create`,
    `media_channel_deactivate`, `media_channel_delete`, `media_channel_groups_set_members`,
    `media_channel_groups_update`, `media_channel_player_candidates`, `media_channel_set_groups`,
    `media_channel_update`, `media_job_poll`, `media_now_next_get`, `media_publication_activate`,
    `media_publication_get`, `media_publication_upsert`, `player_update_devices_list`.
13. **The name can be reused.** `channels_tenant_id_name_key` is a UNIQUE constraint caught as
    `unique_violation` by the create/update paths. Drop the constraint and create a partial unique index
    on `(tenant_id, name) WHERE deleted_at IS NULL`. `media_channel_create` and `media_channel_update`
    catch `unique_violation` without matching the constraint name (prod, 2026-11-20), so the index
    raises the error they already handle.
14. **A Tombstone cannot come back.** `channel_lock` refuses `deleted_at IS NOT NULL` with `not found`.
    That one check covers update, activate, deactivate and delete. Both Group writers
    (`media_channel_groups_set_members`, `media_channel_set_groups`) refuse a deleted Channel.
15. **No race with Program activation or Group edits.** `media_publication_activate` and both Group
    writers take `FOR SHARE` on every target Channel (direct and Group members) and re-check `status`
    and `deleted_at` after the lock.
16. **Draft Programs keep their targets and say so.** `media_publication_get` returns each Channel
    target's name, status and deleted flag. The FE cannot read these from its Channel list once deleted
    Channels leave it. A Draft whose direct target is deleted or not Active shows a notice on open
    (`<name> was deleted` / `<name> isn't active — choose another Channel before publishing.`), modelled
    on `LayoutNotActiveNotice` (ADR 0114). Publish already refuses it (ADR 0099), so the notice explains
    and does not guard. Group targets need no notice: rule 2 keeps a Group's members live.
17. The delete dialog adds: Draft Programs that lose this Channel, and that past Programs and Playback
    Proof keep its name marked deleted.

## Considered options

- **Keep ADR 0038's hard-delete rule.** Rejected: since ADR 0037 it blocks every created Channel, and
  it leaves a Channel the owner has finished with occupying its name forever.
- **Tombstone everything in one step.** Rejected for now: 24 readers to filter plus the three guards
  in 14–16, while a hard delete with no history behind it already solves 68 of the 72 cases.
- **Hard delete a Channel with history, copying its name into `playback_logs`, the rollup and
  `publication_targets` at delete time.** Rejected: an update of up to millions of rows per delete, and
  `publication_targets` still cascades, so its FK and one-ref CHECK would have to change. The Channel
  row already is the snapshot a history needs, as ADR 0101 found for Assets.
- **Why ADR 0038's objection to soft-delete no longer holds.** It said every reader must filter
  forever. That cost was weighed when only history-free Channels could be deleted. Deleting Channels
  that have history makes the filter the price of keeping history, and ADR 0101 already pays it for
  Assets.
- **Delete removes the Channel from its Groups.** Rejected: ADR 0099 refused the same for Deactivate,
  and Drafts targeting the Group would lose a member with no notice.
- **Judge "in use" by the Player's heartbeat or what is playing now.** Rejected: deleting between
  slots would remove tomorrow's schedule.
- **Allow swapping the Player while a Program is live.** Running Programs address devices through
  frozen Job targets (ADR 0039, 0045). Moving the reservation would let another Channel reserve the old
  device while it still plays, and the new device would get nothing until a republish. Doing it right
  needs reservation move, cancel poke (Core ADR 0018) and Job re-materialization in one transaction,
  with the Player team. Deferred to its own issue if a broken-hardware swap becomes a real need.
- **A "move here" action in the Player picker that deactivates the holder.** Rejected: a destructive
  cross-Channel action hidden inside another Channel's editor.

## Consequences

- Phase 1 needs one Core release. The FE part of rule 3 (Deactivate by stored status) can ship ahead of
  it and frees the 72 stuck Players.
- `media_channel_delete` changes behaviour and possibly signature: drop the old signature before the new
  `CREATE`, then re-grant (`CREATE FUNCTION` grants EXECUTE to PUBLIC).
- Rule 1's Group paths tighten the Player change; Deactivate already refuses Group members.
- A Channel can now be Inactive with no Player; activation still requires one
  (`channel_assert_committable`).
- `media_playback_log` resolves the Channel from the device's reservation **when the batch arrives**,
  not at `played_at`. A late batch from a freed Player lands on its new Channel or on none. "Playback
  Proof keeps its name" holds for rows already stored. Not changed here.
- Removing a member from a Group while its Program is live stays allowed. Rule 1 makes that Channel
  still count as in use until the Program ends or is republished.
