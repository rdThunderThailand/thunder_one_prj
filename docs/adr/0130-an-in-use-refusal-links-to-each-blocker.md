# 0130 — An in-use refusal links to each blocker

Status: accepted (2026-11-26, owner decisions in a grilling session on #479).
**Workspace:** media
**Extends:** ADR 0126 (adds `in-use` to `RefusalReason`; picks up its "Not chosen" fix path) and
ADR 0114 (a `[content]` refusal gets the `no-content` fix).
**Amends:** ADR 0127 (the editor lifecycle keeps the `reason` of a failed save, §6 below).
**Relates to:** GitHub #479 (this decision), #460; ADR 0120/0121 (what holds a Playlist); ADR 0122
(Channel delete refusals); ADR 0123 (failure stays inline).

## Context

Some Core refusals name what blocks the action. The screens show those names as text. There is no
way to reach the blockers, so the operator has to remember the names and search for them.

| Screen | Core refusal (RPC) | Core lists |
|---|---|---|
| Playlist → Trash | `Invalid input: playlist is used by an active or draft publication: <names>` (`media_playlist_delete`) | Programs whose stored `status` is draft or active, direct or through a Layout Zone (`playlist_program_ids`) |
| Channel Group delete | `Already in use: remove this group from these publications first: <names>` (`media_channel_groups_delete`) | Programs of **any** status that target the group directly |
| Channel delete / deactivate | `Already in use: these publications still target this channel: <names>` (`media_channel_delete`, `media_channel_deactivate`) | Active and Scheduled Programs (`channel_blocking_publication_rows`) |
| Template Zone delete | `Invalid input: zone is used by composition(s) <names>` (`media_layout_upsert`) | Layouts that bind one of the **deleted** Zones, trashed ones included |
| Program edit | `not found: [content] playlist not found for this tenant` (`media_publication_update_published`) | nothing |

These facts shape the decision:

- **Core sends names only.** Names are joined with `", "`, unquoted and uncapped. Program names are
  not unique per tenant. So the frontend cannot map a name back to an id.
- **Core's error path carries only text.** `callMedia` drops `details`, `hint` and `code`, and
  `apiHandler` answers `{error}`. Ids in the refusal would need both files changed, plus each RPC.
- **Three of the four blocker sets can already be read with ids, and they match the refusal's set:**
  - `GET /media/playlists/:id/programs` (ADR 0121) is built on the same `playlist_program_ids`. Its
    rows with `status` draft or active are the refusal's set.
  - `GET /media/channels/:id` returns `blocking_programs`, built on the same rows function as the
    refusal.
  - `GET /media/publications?group_id=` matches Programs on `publication_targets.group_id`. That is
    the same condition the Group refusal uses, and both ignore status.
- **Template → Layout has no read.** `media_layout_get` returns only `usage_count`, and the Layout
  library list cannot filter by Template.

## Decision

1. **The classifier says which refusals are in-use; it does not route.** The four rows above, for
   Playlist, Group, Channel and Template, get `reason: "in-use"` in `core-refusal-rules.ts`.
   - Their `message` stays the ADR 0126 line, names included.
   - No `names` are parsed out.
   - The classifier still knows neither the page nor any ids (ADR 0114, Not chosen).
   - The Player-change refusal (`cannot remove … while these publications target this channel`) and
     the "remove this channel from its groups" refusals are **not** tagged.
2. **The screen reads its blockers again when an in-use refusal arrives.** The screen already holds
   the id of the thing it tried to change, so it calls the existing read for that id and builds one
   link per blocker:
   - Playlist: the Playlist's Programs, keeping only stored `status` draft or active.
   - Channel Group: the Programs list filtered by `group_id`, every status (matching Core; see
     Consequences).
   - Channel: the Channel's `blocking_programs`.
   - Template: the Template's `compositions`, keeping those that bind a Zone the failed save removed
     (needs Core, §5).
3. **What the operator sees.**
   - Until the read returns, or if it fails or returns nothing, the screen shows the ADR 0126
     `message`, names included.
   - Once the read returns blockers, the screen shows a short line for that screen without the names,
     followed by the links:

     | Screen | Short line |
     |---|---|
     | Playlist → Trash | ย้ายลงถังไม่ได้ — Playlist นี้ถูกใช้อยู่ใน Program ด้านล่าง กรุณา End Program ที่ Active และลบ Program ที่เป็น Draft ก่อน |
     | Channel Group delete | ลบ Group นี้ไม่ได้ เพราะยังถูกใช้ใน Program ด้านล่าง (Program ที่ Ended แล้วจะยังนับอยู่) |
     | Channel delete / deactivate | ยังมี Program ด้านล่างใช้ Channel นี้อยู่ กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อน |
     | Template Zone delete | ลบ Zone ไม่ได้ — Template นี้ยังถูกใช้ใน Layout ด้านล่าง กรุณาเอา Zone นี้ออกจาก Layout เหล่านั้นก่อน |

     The short line is the screen's own copy, chosen by `reason` (ADR 0126 Not chosen: wording that
     differs per screen belongs to the caller).
   - **Every link opens a new tab.** The operator fixes the blocker there and returns to retry,
     without losing the page. That matters most in the Template editor, which holds unsaved Zones.
     This follows `PublishErrorFix` (ADR 0114).
   - **Link targets:**
     - Every Program, Draft included, goes to its detail page `/media-workspace/program/<id>`. That
       page offers the fix for each status: End for an Active Program, Delete (and Edit) for a Draft.
       The existing blocker lists (Playlist panel, Channel editor) link there too.
     - A Layout goes to `/media-workspace/layouts/<id>`, labelled "(ในถังขยะ)" when it is in Trash.
     - The label is the blocker's name.
   - **Group links say when a Program is over.** Core counts Ended and Cancelled Programs as Group
     blockers. Nothing can be done to those Programs: cancel takes only `active`, delete only
     `draft`, and edit refuses an ended Program. So their link label carries "(Ended)" or
     "(Cancelled)", and the Group line does not ask the operator to cancel them.
   - **No cap on the number of links.** Capping would hide a blocker that is real. The links wrap,
     and the Group inspector already scrolls.
4. **Screens in scope.**
   - The Playlist row Trash dialog **stays open** and shows the refusal and its links inside the
     dialog. Today the dialog closes and a 10px line appears on the list page. Move and permanent
     delete keep today's behaviour.
   - The Channel Group inspector.
   - The Channel Delete dialog.
   - The Channel editor's Lifecycle card, for deactivate.
   - The Channels row menu, for Disable. Its popover is too narrow for a list, so it keeps the
     `message` and adds one link, "เปิด Channel", to `/media-workspace/channels/<id>/edit`. That page
     already lists the blocking Programs as links. The row's Delete opens the Delete dialog, which
     gets the links.
   - The Template editor.
5. **Template needs one additive Core field.** `media_layout_get` returns
   `compositions: [{id, name, zone_ids, in_trash}]` beside `usage_count`: every Layout
   (`compositions` row) that uses this Template, with the Template Zones it binds.
   - On an in-use refusal the editor reads the Template again. The removed Zones are the stored Zones
     the failed save no longer carried. It keeps the Layouts whose `zone_ids` meet them. That is the
     refusal's own condition.
   - The frontend treats a missing `compositions` field as "no blockers". It shows the `message` and
     can ship before Core.
   - The Core part is a draft issue in the plan. The owner files it.
6. **The editor lifecycle keeps the reason (amends ADR 0127).**
   - `save-failure` carries `reason?: RefusalReason`.
   - The lifecycle state and the hook expose `saveReason: RefusalReason | null` next to `saveError`.
     It clears whenever `saveError` clears.
   - `saveError` stays a string, so the Playlist and Composition editors do not change.
7. **`[content] playlist not found` gets the `no-content` fix.**
   - Its table row, which already applies only to the `[content]` tag, gets `cause: "no-content"`.
   - The Program Edit page then shows the existing "เลือกเนื้อหา" button, which scrolls to the content
     card. The message moves from the card's field error to the page alert, as every caused refusal
     does there.
   - Untagged `playlist not found` (Playlist delete, wizard upsert) is unchanged.

## Not chosen

- **Core sends ids in the refusal (`RAISE … USING DETAIL`, forwarded by `callMedia`/`apiHandler`).**
  This gives the exact refused set with no second request, and it would be a first step toward
  error codes (ADR 0126, option C). But it changes two shared Core files and four RPCs, mostly
  baseline functions on prod, and the frontend cannot start until Core ships. It belongs with error
  codes across Core, not with four refusals.
- **Resolve ids from Core's names.** Program names are not unique, and `", "` inside a name makes the
  list ambiguous to split.
- **One link to the page that lists the blockers** (the Playlist panel's Programs tab, the Channel
  editor, the Programs list filtered by group). It needs no ids, but it costs a click, and the issue
  asks for each Program. Template has no such page, and the Programs list would have to read filters
  from the URL. It is kept only for the Channels row menu (§4), where a list does not fit.
- **Link a Draft to the wizard (`/program/create?id=`).** This was chosen first, then reversed after
  review. The wizard has no Delete, and a Draft can only be deleted, not cancelled, so the link led
  nowhere.
- **Cap the link list.** It would hide blockers Core still counts.
- **Keep the names in the message and add the links below.** Each name would appear twice.
- **Turn the names in the message into links in place.** This means splitting Core's text, which is
  fragile for the same reason as resolving names.
- **Show only Group blockers that have not ended.** The list would then disagree with the refusal,
  and the operator could see an empty list for a Group they still cannot delete.
- **A `layout_id` filter on the Layout library list.** It lists every Layout that uses the Template,
  which is more than the refusal names. It has no Zone detail and comes back in pages.
- **The lifecycle keeps the whole `ClassifiedError`.** No editor needs `cause` or `part` from a save
  yet, and the change would touch all three editors.
- **Batch Trash, the Player-change refusal, and the "remove this channel from its groups" refusals.**
  They are follow-ups (see Consequences).

## Consequences

- **A new in-use refusal takes three changes:** a row with `reason: "in-use"`, a read that returns
  the blockers with ids, and a short line on the screen. The classifier stays route-free.
- **A blocker list can be newer than the refusal.** A Program cancelled between the refusal and the
  read drops out of the list. When nothing is left, the message is shown, and a retry will likely
  succeed.
- **The read and the refusal must keep the same set.** If Core changes one without the other, the
  links and the refusal disagree. The plan's fixtures name the shared Core functions so a reviewer
  can check both.
- **Template links wait for Core.** Until `media_layout_get` returns `compositions` on prod, the
  Template editor shows today's message. No frontend release is needed when Core ships.
- **A Group that any Program ever used cannot be deleted today.** Core counts Ended and Cancelled
  Programs, and nothing can be done to those. This ADR only makes the screen say so (§3).
  - The fix is a Core rule change, proposed in the plan's Core draft issue: only Programs that have
    not ended should block, as for Channels.
  - When Core ships it, the Group read adds `display_status: "not_ended"`, so the links match again.
- **Follow-ups:**
  - Batch Trash reports only a count.
  - The Player-change refusal names Programs, but its line does not show them.
  - The "remove this channel from its groups" refusals name Groups, and Groups have no detail route.
  - The Layout (Composition) editor can rewrite a shared Template's Zones too (`save-composition.ts`),
    so it can raise the same Zone refusal. It keeps showing the `message` with names; the links are
    for the Template editor only.
