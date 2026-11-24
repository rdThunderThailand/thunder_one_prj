# 0122 — Deleting an unused Channel frees its Player; a Channel with history becomes a Tombstone

Status: accepted (2026-11-20, owner decisions in a grilling session on "move a Player to a new Channel
and delete the old one"; scrutiny round 1 applied the same day). Phase 2 (rules 11–20) amended
2026-11-22. Rule 17 amended 2026-11-24 (unsaved picks the Channel picker cannot show, and the fix
button no longer saves first).
**Workspace:** media-workspace

Supersedes the hard-delete rule of [ADR 0038](0038-channel-lifecycle-retirement-and-concurrency.md)
("`activated_at` is the retirement evidence") and its rejected option "Soft-delete every Channel".
Amends [ADR 0037](0037-channel-status-derived-from-publications.md) (Deactivate is no longer the only
lifecycle button) and [ADR 0074](0074-channel-one-player-and-channel-group.md) §1 (an Inactive Channel
may be Player-less). Keeps [ADR 0099](0099-programs-reach-only-active-channels.md)'s rule that Group
edits are explicit. The reservation table of ADR 0030 is unchanged. Rule 17's 2026-11-24 amendment
amends [ADR 0114](0114-final-step-publish-errors-name-the-cause-and-lead-to-the-fix.md) §5 in the
wizard: a fix's step jump no longer saves first, and every failed save carries its `cause`.

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

Amended 2026-11-22: owner decisions in a second grilling session, then scrutiny the same day.

Measured read-only on prod on 2026-11-22: 84 Channels are not in use. 68 of them have no history
(rule 8 removes them), 4 are in a Group, 2 have history only through Draft or Cancelled Programs and 10
have playback logs. Those 12 need this phase, and every Channel that airs joins them once its Programs
end.

**Delivery order.** Phase 2 ships as three steps, and nothing creates a Tombstone before the last one:

- **S1 + S2** — one Core release, no behaviour change: rules 12, 13, 14, 15, 16 and the Core parts of
  17, 18 and 20.
- **S4** — the FE parts of rules 16, 17, 18 and 20, on top of that release.
- **S3** — the Core release that turns the Tombstone on: rules 11 and 19.

11. **Delete has one button, and Core chooses what it does.**
    - A Channel with no history is hard-deleted exactly as in rule 8. The history test is one helper,
      shared with rule 8.
    - A Channel with history becomes a **Tombstone** in one transaction: set `deleted_at` and
      `status = 'inactive'`, and delete its `channel_device_reservations` and `channel_devices` rows.
      The Channel row stays, so `publication_targets`, Playback Proof and the rollup still resolve its
      name.
    - There is no undo: the Player may already be reserved elsewhere.
    - The result names the mode (`removed` or `tombstoned`), so the success toast says the right thing.
12. **Schema.**
    - Add `deleted_at timestamptz` only. `channel_audit` already records who deleted the Channel.
    - Add CHECK `deleted_at IS NULL OR status = 'inactive'`. Every check that requires
      `status = 'active'` then refuses a Tombstone without testing `deleted_at`: in
      `media_publication_activate`, both Group writers and `channel_set_devices`.
    - A Draft Channel with history leaves the lifecycle by going straight from Draft to a Tombstone,
      which is inactive. Prod had no Draft Channels on 2026-11-22.
13. **Readers change only where a Tombstone can reach them.**
    - **Scope:** every function that reads `media_core.channels`, plus every function that passes on a
      Channel id read from another table (`publication_targets`, `publication_snapshot_group_members`,
      `channel_group_members`, `playback_logs`, the reservations). Examples of the second kind:
      `media_publication_duplicate`, `publish_changes_apply`, `now_next_candidates`,
      `publication_channel_ids`, `media_publications_list`, `media_channel_groups_delete`,
      `media_playback_log`, `media_playback_proof_list`, `media_playback_proof_export`.
    - **The 24 functions that read `media_core.channels` on prod on 2026-11-22:** `channel_audit`,
      `channel_group_rows`, `channel_lock`, `channel_rows`, `channel_set_devices`,
      `playback_proof_check_args`, `playback_proof_rows`, `publication_group_warnings`,
      `media_calendar_get`, `media_channel_activate`, `media_channel_create`,
      `media_channel_deactivate`, `media_channel_delete`, `media_channel_groups_set_members`,
      `media_channel_groups_update`, `media_channel_player_candidates`, `media_channel_set_groups`,
      `media_channel_update`, `media_job_poll`, `media_now_next_get`, `media_publication_activate`,
      `media_publication_get`, `media_publication_upsert`, `player_update_devices_list`.
    - **Each gets a written verdict.** The phase 2 plan records, for each function, "changed" or
      "unchanged because …".
    - **Valid reasons for "unchanged":** a Tombstone has no reservation; it is never in an Active or
      Scheduled Program; it is always inactive (rule 12); it is never in a Group (rule 2); the function
      reads no Channel row or name, only ids, counts or existence; it resolves history, where a Tombstone
      must still resolve. The Playback Proof CSV export keeps the plain name.
    - **What changed readers do:** live surfaces (lists, the Channel detail, pickers) filter
      `deleted_at IS NULL`. History readers return a `deleted` boolean, as ADR 0101 does for Assets.
14. **A Tombstone cannot come back.** `channel_lock` refuses `deleted_at IS NOT NULL` with its existing
    `not found: channel not found`. That one check covers update, activate, deactivate and delete. The
    Group writers already refuse a Tombstone through the status rule (rule 12).
15. **No race with Program activation or Group edits.** Each writer takes `FOR SHARE` before its status
    check:
    - `media_publication_activate` locks every Channel it reaches (direct targets and Group members),
      with `FOR SHARE … ORDER BY id`.
    - `media_channel_groups_set_members` locks the Channels it adds.
    - `media_channel_set_groups` locks its one Channel.
    - `media_channel_groups_update` changes only the Group's own attributes and stays as it is.

    Against `channel_lock`'s `FOR UPDATE` this closes the race in both orders under READ COMMITTED. It
    also closes the existing race between Deactivate and Publish. The foreign key's `KEY SHARE` lock
    is not enough on its own: it is taken at the `INSERT`, after the status check has read the row.
16. **Publish names a deleted target.**
    - `media_publication_activate` checks for deleted targets before it checks "not active". It raises
      `these channels were deleted — remove them from this Program: <names>`.
    - The FE maps it in `publish-cause.ts` as its own cause, in the same Thai as the existing
      `these channels are not active` mapping.
    - `media_publication_upsert` is unchanged, so a Draft with a deleted target still saves. Publish is
      the guard.
17. **Draft targets stay and say so.**
    - `media_publication_get` returns each Channel target's `status` and `deleted`.
    - A Draft is edited and published in the wizard (`/program/create?id=`), and the Program edit page
      lists targets too.
    - **Both screens:** show a notice for a target that is deleted or not Active, modelled on
      `LayoutNotActiveNotice` (ADR 0114) and in the same Thai as the other publish notices. Both also list such a target under its saved name, with
      Remove. Today the wizard draws targets from the Channel list, so it hides any id missing from that
      list while still counting it.
    - **Duplicates:** duplicating an Ended Program copies its targets (`media_publication_duplicate`),
      so a new Draft can carry a Tombstone the same way. Publish refuses it by name, as ADR 0101 does
      for Assets.
    - **Group targets:** need no notice, because rule 2 keeps a Group's members live.
    - **Unsaved picks the Channel picker cannot show** (amended 2026-11-24, owner decisions in a grilling
      session, then two scrutiny rounds the same day). FE only, with no Core change; it ships on its own
      and does not wait for S3, because rule 8's hard delete is already live. The wizard's
      **problem targets** are the saved Channel targets that `media_publication_get` flags deleted or
      not Active; the wizard reads them when it opens a Draft. A pick that lives only in the local Create draft is not among them. The Channel
      list here is the wizard's one `GET /media/channels` read: every status, no Tombstones, read once
      when the wizard opens. The picker shows only its Active rows (`toChannelItems`).
      - **Unlisted pick:** a selected id that is neither in the Channel list nor a problem target, once
        the list has loaded without error. Rule 8 refuses a Channel that any `publication_targets` row
        names, but a local pick holds nothing, so its Channel can be hard deleted. Then
        `media_publication_upsert` refuses every save that sends targets
        (`not found: channel … not found for this tenant`), and the wizard showed nothing to remove.
        After S3 a local pick can also become a Tombstone: it is unlisted too, saves, and only Publish
        refuses it. The notice adds one line for all unlisted picks,
        `ช่องทางที่เลือกไว้ N รายการไม่มีในระบบแล้ว — นำออกก่อนบันทึกหรือเผยแพร่`, with one Remove that
        drops them all. The draft keeps no Channel names, so the line cannot name them.
      - **Inactive pick:** a selected id that is in the Channel list but not Active, and not a problem
        target. Save accepts it, Publish refuses it as not active, and the picker hides it. It gets the
        existing not-Active line under its name from the list, with Remove.
      - The wizard shows the whole notice on every step, not only Program and Review. Once Program has
        been reached, every save sends targets (`draftSavePolicy`), so the notice warns before the
        next save fails, on whichever step that save is made.
      - **The error's fix goes straight to its step** (amends ADR 0114 §5). The fix button beside a
        refusal (for this one, `แก้ปลายทาง` to Program) no longer saves first, for every cause. It used
        `handleStepSelect`, which saves a dirty server Draft first (#226), and that save returned the
        same refusal, so the button led nowhere. The stepper itself still saves first, and an edit made
        before a fix jump stays in the local draft until the next save.
      - **Every failed save in the wizard carries its cause** (amends ADR 0114 §5). Next, the stepper
        jump and Save draft all show a failed save through `classifyApiError` and keep its `cause`, so
        the fix button shows beside each. A refused stepper jump shows its error under the stepper, not
        in the footer below the step (ADR 0123 rule 2). Next and the stepper jump showed Core's raw
        text, and Save draft dropped the cause. This refusal then reads
        `ไม่พบช่องทางหรือกลุ่มที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่`.
      - Nothing removes an unlisted or inactive pick automatically, as for a Tombstone.
      - The publish gate still counts an unlisted pick, and Core refuses it. The summary rail lists the
        names it knows, so an unlisted pick shows only in its "N channel(s)" fallback, used when no
        selected target has a name.
      - **Picked Groups get no notice.** The wizard reads no Group list at its root; `GroupsStep` reads
        its own (`GET /media/channel-groups`, every status, filtered to Active on the client per ADR 0074
        §5). A Group picked only in the local draft can be hard deleted, and every save then fails with
        `not found: channel group …`. The Program step shows every picked Group as a removable chip, and
        the fix button reaches it from any step.
      - The Program edit page keeps no local picks, so only the wizard changes.
18. **History keeps the name.** Program detail and Playback Proof show `<name> (deleted)` with no link,
    as Playback Proof already does for a source that is gone. `media_publications_list` counts stay as
    stored.
19. **The name can be reused.**
    - Drop `channels_tenant_id_name_key` and create a partial unique index on `(tenant_id, name) WHERE
      deleted_at IS NULL`. `media_channel_create` and `media_channel_update` catch `unique_violation`
      without matching the constraint name (prod, 2026-11-20), so the index raises the error they
      already handle.
    - History may then show "Lobby (deleted)" next to a new "Lobby".
    - There is no view of deleted Channels, since there is no undo.
    - Before the constraint is dropped, check every writer of `media_core.channels` outside Core, such as
      Aurora-migrate, for `ON CONFLICT (tenant_id, name)`.
20. **The delete dialog knows the mode before the click.**
    - The dialog fetches the Channel detail when it opens, also from the list row menu. The detail adds
      `draft_programs: [{ id, name }]` and `has_history`.
    - With no history, the text is as in rule 9.
    - For a Tombstone, it lists the Draft Programs that lose this Channel and says past Programs and
      Playback Proof keep its name, marked deleted.
    - Both modes say "This can't be undone."
    - The text is advisory, because Core decides when Delete is confirmed. A target added in between can
      change the mode, and both modes are irreversible.

## Considered options

- **Keep ADR 0038's hard-delete rule.** Rejected: since ADR 0037 it blocks every created Channel, and
  it leaves a Channel the owner has finished with occupying its name forever.
- **Tombstone everything in one step.** Rejected for now: 24 readers to filter plus the guards in
  rules 14–16, while a hard delete with no history behind it already solves 68 of the 72 cases.
- **Deactivate, rename and hide Inactive Channels by default instead of a Tombstone** (2026-11-22, for
  the 12 left after phase 1). Rejected for three reasons:
  - History readers resolve the Channel name live, so a rename rewrites past Programs and Playback
    Proof.
  - Inactive means paused and may come back, so hiding it by default hides paused Channels too.
  - The 12 grow as every Channel that aired finishes.
- **Tombstone every delete, including a Channel with no history.** Rejected: rule 8 already removes such
  a Channel cleanly, and keeping its row adds nothing to any history.
- **`media_publication_upsert` refuses a deleted target.** Rejected: a Draft could not save any other
  edit until the target was removed. Publish is the guard (rule 16).
- **Ship the Tombstone (S3) with or before its FE (S4).** Rejected: there would be a window in which
  Delete creates Tombstones while the dialog still describes phase 1, and the wizard hides the deleted
  target that blocks Publish.
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
- **Drop an unlisted pick from the draft once the Channel list loads, then say so** (2026-11-24).
  Rejected for two reasons:
  - It changes the draft without the user asking.
  - Core's problem targets come from a separate read that can fail silently. A saved Tombstone target
    is missing from the Channel list too, so it would be dropped whenever that read is late or fails,
    against "Draft targets stay".
- **Leave unlisted picks out of the targets a save sends** (2026-11-24). Rejected:
  - The local draft and the saved Draft disagree.
  - The ghost id stays in local storage.
  - The wizard's `targetsFromSelection` (`draft-mapping.ts`) would drop a saved Tombstone target the
    same way unless it also knew the problem targets.
- **The fix button removes the id that Core's refusal names** (2026-11-24, raised in scrutiny). It
  would cover Groups and a Channel deleted while the wizard is open. Rejected:
  - It changes the cause mapping and fix modules that the Program edit page shares.
  - Core stops at the first missing target, so it removes one id per failed save.
  - A fix button that goes straight to Program already reaches both the notice and the Group chips.
- **Hide the fix button for this refusal** (2026-11-24). Rejected: a Group picked on Prepare Content
  would then have no way to its chip.
- **A stepper jump whose save fails still moves to its step and keeps the error** (2026-11-24, raised
  in scrutiny; the wizard already does this for an invalid schedule, ADR 0086 §2). The fix button could
  then keep using `handleStepSelect`. Rejected: it changes #226 for every jump, so no refused save would
  hold the operator on the step any more. Only the fix button exists to lead away from the refusal.
- **Read the Group list at the wizard root and name a deleted Group in the notice** (2026-11-24).
  Rejected for now: one more read every time the wizard opens, beside the one `GroupsStep` makes, while
  the chip and the fix button already reach Remove.
- **Keep `channelNamesById` beside `groupNamesById` so the line can name Channels** (2026-11-24).
  Rejected: every draft would carry a second copy of Channel names for a rare case, and drafts written
  before it would still have none.

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
- Phase 2 needs two Core releases (S1 + S2, then S3) with an FE release between them. Dropping the
  unique constraint in S3 is a prod schema change that is approved on its own.
- A Draft or a duplicated Program can carry a Tombstone target indefinitely. Nothing removes it
  automatically; the notice (rule 17) and Publish (rule 16) make the operator do it.
- Until Core's problem targets load, or if that read fails, a saved Tombstone target shows on the
  unnamed unlisted-pick line instead of under its name. It is still visible and removable.
- The rule 17 lines for saved targets now also show on Choose Content, Prepare Content and Publish.
- A hard-deleted Group that is picked only in the local draft still makes every save fail until its
  chip is removed. The save error names the cause and its fix button leads to the chip, but the jump
  clears the error, and the chip itself shows only `<name> · 0 channels`.
- The Channel list is read once when the wizard opens. A Channel deleted or deactivated while the
  wizard is open stays in that list as a selected card the operator can untick, but nothing says which
  card it is until the page reloads.
- The resume prompt (ADR 0086) saves the old draft before it starts new content. When that save is
  refused because of a missing target, the prompt shows its generic `บันทึก draft เดิมไม่สำเร็จ
  กรุณาลองอีกครั้ง`, and retrying cannot pass. Continuing the old draft still opens the wizard, where
  the notice shows Remove. Left to the ADR 0086 §9 work, which changes the same hook.
- `classifyApiError` still passes an unmapped 4xx message through as it is, on every save path. That
  breaks the rule that the UI never shows raw backend text; accepted for now and left as a follow-up.
