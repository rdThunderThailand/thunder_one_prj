# 0080 — Published Programs are edited in place, without a draft revision

Status: accepted (2026-09-30, grilling session on the Program redesign mockups in `docs/program/figma-mockup/`, then review round 1). Extends ADR 0053 (republish in place) and ADR 0078 (Publish Changes). Plan: `docs/program/plan-program-redesign.md`.

## Context

The Program redesign adds an Edit page for any Program, including a Live one (mockup 03/04: Save, Publish, "Changes will be applied after publishing"). Today every write RPC (`media_publication_upsert`, `_set_content`, `_set_schedule`) raises `only draft publications can be edited`; the only way to touch a published Program is `media_publication_republish`, which re-snapshots content but keeps name, targets, schedule and priority frozen. The mockup also contradicts itself: mockup 02's "Actions by Status" makes Live view-only, while 03/04 edit a Live Program.

## Decision

1. **Draft** keeps today's behaviour: Save writes the draft, Publish activates it.
2. **Scheduled and Live** have no Save. The Edit page holds the operator's changes in page state and offers one action, **Publish changes**, behind the review/confirm modal (mockup 04 #6). It calls one new RPC, `media_publication_update_published`, built the way `media_publication_republish` already is — no new validation code:
   1. lock the Publication row and check `expected_revision`;
   2. refuse unless stored status is `active` **and** effective status is not `ended` (see 4);
   3. set status to `draft` (never observable outside the transaction);
   4. call the existing `media_publication_upsert` / `_set_content` / `_set_schedule` for the changed parts — they validate and bump `revision`;
   5. call `media_publication_activate`, which snapshots and creates the new Publish Job.
   The old snapshot keeps airing until the transaction commits. Leaving the page with unpublished changes shows the Discard dialog (mockup 04 #1).
3. Because it runs `activate`, every activation guard applies unchanged — tenant ownership, schedule conflicts by priority (ADR 0068), Layout/Channel geometry confirmation (ADR 0079), quarantined assets. A target removed by the edit stops receiving the Program on its next poll; the confirm modal states "will stop playing on N channels". **This depends on the poll fix below.**
4. **Ended is read-only.** `update_published` refuses effective status `ended` (stored `active` with `ends_at` in the past — `republish`'s `v_status <> 'active'` guard alone lets it through). To air an ended Program again, Duplicate it.
5. **Delete** is a real delete only for Draft — `media_publication_delete` already refuses anything else ("cancel the publication instead"), so this is FE button mapping only. Scheduled and Live get **End program** (the existing irreversible `media_publication_cancel`) with a confirm step; Ended has no delete. Hard-deleting an aired Program would destroy its snapshots and Playback Proof.
6. **Playback pattern stays owned by the Playlist** (ADR 0062). The Edit Schedule modal may change the bound Playlist's `play_mode` (sequential/shuffle) only, with a warning naming the Playlist and the number of Programs that use it (the existing `affected-programs` read). The write lands on the Playlist when this page saves or publishes; Publish changes re-snapshots **this Program only** — other affected Programs follow ADR 0078 as before. Repeat single item, item duration, respect item duration and sync to channel time render disabled; the whole section is disabled when the content is a Layout ("set per Zone").

### Prerequisite: the poll must follow the newest Job

`media_job_poll` (live `develop` definition, 2026-09-30) filters `WHERE pjt.device_id = v_asset_id` **before** `DISTINCT ON (pub.id) ORDER BY pj.created_at DESC`, so it picks the newest Job *that still targets this device*. A device dropped from the newest Job falls back to an older Job and keeps playing the old snapshot until the schedule ends or the Program is cancelled; neither `activate` nor `republish` closes older Jobs. The same fault already affects Channel Group membership changes followed by republish (ADR 0074) and Publish Changes (ADR 0078).

Fix: the poll selects the newest Job per Publication first, then requires this device to be among that Job's targets — the definition `media_core.media_asset_on_air` already uses. No new state, no backfill. Ships before `update_published` (plan BE-0).

### Display status (UI only)

The list and Edit page show five badges. None of them is stored or used in a guard; stored and derived lifecycle status (ADR 0004) is unchanged.

| Badge | Rule |
|---|---|
| Draft | stored `draft` |
| Publishing | `active`, and the newest Job still has a target waiting for delivery on an **online** device (failed counts as finished; offline devices are not waited for) |
| Live | `active`, delivery settled, and `recurrence_matches(recurrence, timezone, now())` inside `starts_at`–`ends_at` — airing right now |
| Scheduled | derived `scheduled` (not started — "Starts in 2 days"), **or** `active` and delivery settled but between airings ("Next airing 06:00") |
| Ended | derived `ended` or stored `cancelled` |

Publishing shows a delivery fact in the lifecycle badge, which CONTEXT.md otherwise keeps apart ("the two status vocabularies never merge"). It is accepted as presentation only; offline and failed targets are shown separately in the Deployment column, never by holding the badge. Because Live and Scheduled depend on the time of day, filtering by badge changes with the clock. Paused is out of scope (no pause/resume exists).

## Considered options

- **Live is view-only; edit = Duplicate into a new Draft** (mockup 02). Zero backend work, but the Edit page — the centre of the redesign — would only ever open for Drafts.
- **Draft revision of a Live Program** (Save stores a pending copy, Publish swaps it in). Matches mockup 03 exactly, but every reader of a Program would have to know about two versions. Rejected until someone needs to park unpublished edits on a Live Program.
- **Close older Jobs' targets on activate** instead of fixing the poll. Needs a new column and handling of existing rows. Rejected for the poll-side fix.

## Consequences

- A Live Program can change targets and schedule in place, keeping its id; history of what aired stays in the snapshots, not in the Program row.
- Two operators editing the same Live Program: the second Publish changes is refused on `expected_revision`. `activate`, `republish`, `cancel` and `playlist_publish_changes` do not bump `revision`, so a page left open after the Program was ended is stopped by the status guard (4), not by the revision check.
