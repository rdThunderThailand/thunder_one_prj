# 0114 — Final-step publish errors name the cause and lead to the fix

Status: accepted (2026-11-17, owner decisions in a grilling session on the v1.0 P0 list; scrutiny
round 1 applied). Applies ADR 0049 §10 to the Program wizard and Edit page; no Core or schema change.

## Context

QA picked an Inactive Layout in the Program wizard, went through every step, pressed Publish and got
"ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง…" — a message that names neither the Layout nor the fix.

- ADR 0049 §10 already says a Publication may only select an `active` Composition; `inactive` means
  retired. The ver02 wizard picker (#81) drops only `draft`, and does so in the browser after fetching
  one page of 50 (`CompositionPickerModal.tsx:69-70`), so Inactive Layouts are offered and Draft or
  Inactive ones can push Active ones off the page.
- The picker is not the only way in. The wizard also opens with content already bound from the
  Layout editor (`?compositionId=`), the Playlist editor and Playlists list (`?playlistId=`), and from
  a saved Draft (`?id=`) — including Programs migrated from Aurora whose Layout is still Draft. None
  of these pass through the picker, and nothing in the wizard checks the Layout before Publish.
- The wizard has five steps (`mock-data.ts` `wizardSteps`): 1 Choose Content · 2 Prepare Content ·
  3 Program (Targets and Schedule) · 4 Review · 5 Publish. Step 2 edits files only for an image/video
  Program; a Playlist Program's files live in the Playlist, a Layout Program's in its Zones' Playlists.
- Publish runs `persistDraft` (`media_publication_upsert` → `set_content` → `set_schedule`) and then
  `media_publication_activate`. Refusals come from all of them. Before this decision the final step
  mapped some to Thai, sent others to the generic `Invalid input:` bucket or to the 404 "ไม่พบเนื้อหานี้"
  line, and showed the rest in raw English. None offered a way to the fix.
- Core does not check a Playlist's status on activate, only that it resolves to playable items.

## Decision

1. **Only an Active Layout is offered.** The Layout picker (wizard and Edit page share it) asks Core
   for `status: "active"` (the list endpoint already takes it) instead of filtering a page in the
   browser; the Status filter goes, since one value is left. A Layout already bound to a Program is
   read by id, not from this list, so an Inactive one still shows where it is bound; the picker opens
   with nothing staged when the bound id is not in its list.
2. **The wizard checks the bound Layout wherever the operator came from.** On Prepare Content (step 2)
   a non-Active Layout shows a warning. On Publish (step 5) the Publish button is disabled with the
   reason. The Edit page does the same for a Draft Program (PR #394).
3. **The warning offers the fix in place.** "Complete" means every Zone is bound — the only thing
   `media_composition_set_status` checks; it takes no revision. When complete, the warning carries an
   **Activate Layout** button calling `PUT /media/compositions/:id/status` (`active`); the gate takes
   the returned status, so the warning clears without a reload. When Zones are unbound, the warning
   links to the Layout editor in a new tab. Re-activating an Inactive Layout is the
   `inactive → active` transition ADR 0049 §10 allows. An activated Layout can still be refused later
   for having nothing playable (a Zone Playlist with no ready items); that refusal is mapped below.
4. **An end date in the past is caught before Publish.** Step 5 compares the schedule's resolved
   `ends_at` with the clock when the button is pressed (Core checks `ends_at <= now()`), and refuses
   with the same message as item 5.
5. **Every refusal at the final step names its cause, its fix and a way there.** `classifyApiError`
   adds an optional `cause` to `ClassifiedError`. It matches on the message text whichever RPC raised
   it, ahead of the generic `Invalid input:` and 404 branches. One function on each publish page turns
   `cause` plus the Program's type and ids into a button: a step jump, or a link in a new tab (the Draft
   is kept). A step jump clears the old error. Names in Core's message (Zones, Channels, Groups, files)
   are kept; Core's English is not.

   | Core refusal (raised by) | `cause` | Message says | Fix |
   |---|---|---|---|
   | `[schedule] end time is in the past` (activate) | `schedule-ended` | "Program นี้สิ้นสุดเมื่อ dd/mm/yyyy HH:mm ซึ่งผ่านไปแล้ว ถ้าเผยแพร่ตอนนี้จะไม่ได้ออกอากาศเลย กรุณาเลื่อนวันสิ้นสุด หรือเอาวันสิ้นสุดออก" (date from page state; without it, the same sentence without the date) | step 3 |
   | `starts_at is required`, `ends_at must be after starts_at`, `daily_start must be before daily_end`, `recurrence requires daily_start and daily_end`, unknown timezone, `recurrence.*` shape refusals (set_schedule, migration 20261111170000) | `schedule-invalid` | which schedule field is wrong | step 3 |
   | no layout · no playlist (activate); composition not found (upsert, activate) | `no-content` | no content chosen, or it was removed | step 1 |
   | composition is not active (activate) | `layout-not-active` | the Layout must be Active | Activate in place, or the Layout |
   | zone(s) … are unbound (activate) | `zones-unbound` | which Zones are unbound | the Layout |
   | playlist … has no items · … produced zero resolvable snapshot items (activate) | `nothing-playable` | the content has nothing playable | the Playlist (playlist Program) or the Layout (layout Program); step 2 (image/video) |
   | at least one target · synchronized group incomplete · device inside a synchronized group (activate); channel / channel group not found (upsert) | `targets` | what is wrong with the targets, with names | step 3 |
   | channels are not active (activate) | `channels-inactive` | (existing ADR 0099 wording) | Channels |
   | targets have no screens (activate) | `no-screens` | (existing #134 wording) | Channels |
   | `cannot activate — …` with any of: replace this file / remove or restore from Trash / file was deleted / wait — conversion in flight (activate) | `files` | every part, each with its files and what to do | step 2 (image/video); the Playlist or the Layout otherwise |

   Not mapped on purpose: `Already active` (a timed-out publish that succeeded; treated as success) and
   `publication not found` (the wizard re-creates the Draft). Server and transport failures (5xx,
   network) keep the existing retry message and carry no `cause`. The Edit page uses the same `cause`s;
   its step jumps become the matching card.

## Not chosen

- **Refuse to open the wizard for a non-Active Layout.** A migrated Draft could then not be opened at
  all, not even to change its Layout.
- **Only link to the Layout editor.** Most migrated Layouts are complete and only need activating;
  sending the operator away for one click loses their place.
- **Show Inactive Layouts greyed out in the picker.** Inactive means retired (ADR 0049 §10); the
  operator who wants one back re-activates it where Layouts are managed.
- **Block Draft or Inactive Playlists too.** Core accepts them and no decision defines what their status
  means for playback; adding the rule now risks blocking migrated Playlists right before v1.0.
- **Activate the Layout automatically on Publish.** A state change nobody asked for (ADR 0049 §10 already
  rejected auto-demotion for the same reason).
- **A `fix` with routes inside `classifyApiError`.** The classifier knows neither the Program's type nor
  its ids, so it would point a Playlist Program's file problem at step 2, which cannot fix it.

## Consequences

- One mapping (`src/lib/api/api-error.ts`) serves the wizard and the Edit page; a new Core refusal needs
  one row there, plus a `.check.mts` case. Its ~40 other callers ignore `cause`.
- Routing lives with the page that holds the ids; `api-error.ts` stays free of it.
- Core stays the final authority. A pre-check that disagrees with Core only moves the message earlier;
  it never lets a refused publish through.
- Known gap, not addressed here: when "only draft publications can be edited" makes the wizard re-create
  a Draft that another tab already published, a duplicate Program can result.
