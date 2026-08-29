# Thunder One

The shell every user lands in after login, wrapping three Apps — Communication, Asset Intelligence, and ThunderCare — reached through the Work Space launcher (see `### Shell & Apps` below). Most of this file documents Communication's domain: digital signage / DOOH media management, where operators publish media content to physical screens across locations and the platform tracks delivery and playback. ThunderCare has no distinct terms of its own yet.

## Language

### Shell & Apps

**Thunder One**:
The outer shell every user lands in after login (`/`) — introduced so a growing number of Apps stop competing for the top-level route `/` previously owned by Communication alone. Wraps every App and owns two cross-app rollup destinations that belong to no single App: **Mission Control** (organization-wide, strategic rollup) and **My Work** (cross-app "what's assigned to me"), plus two sections named after the Asset Intelligence requirement doc's Experience Layers but not yet built: **Intelligence** (risk/insight/recommendation) and **Governance** (ownership/permission/policy/audit). None of these four is a mandated cross-app aggregation pattern — each sources its own data however it needs to. `docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`.
_Avoid_: ThunderOne (the sidebar wordmark/product name, written without a space — same brand, but that's the logo text, not this shell concept)

**App**:
One of the three domains reached from inside Thunder One: **Communication**, **Asset Intelligence**, **ThunderCare**. Never landed on directly after login — only Thunder One is.

**Work Space**:
The launcher into the Apps — a dedicated page listing every App as a tile, not a dropdown menu. A dropdown was rejected because the App list is expected to keep growing. `docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`. Opening an App tile navigates in the same tab, same as every other link in Thunder One — the shell's Sidebar persists across every App (one shared `DashboardLayout`), so the shell is always one click away via the logo; a new tab/window was considered and rejected 2026-08-20 as unneeded overhead.

**Communication** (formerly "Media Workspace"):
The DOOH content-management App. The rest of this file — `### Roles` onward — describes Communication's domain unless marked otherwise (the two Asset Intelligence terms are the deliberate exception; see the note on why not to split this file yet).

**ThunderCare**:
The field-service App. Absorbs Asset Intelligence's former Technician and Thunder Care personas (work-order execution, service-queue/SLA management) wholesale — see `src/features/thunder-care/work-orders`, `src/features/thunder-care/service-ops`. Nested under `features/thunder-care/*`, same pattern as Communication and Asset Intelligence — `docs/adr/0034-feature-folders-nest-under-app.md`.

### Roles

These three are the *intended* product roles. Nothing enforces them yet: Thunder One has no
permission gates, and the platform's own role data does not use this vocabulary — `public.roles`
holds tiers (`super_admin`, `company_admin`, `department_admin`, `executive_viewer`, `operator`,
`tenant`) and facilities-flavoured personas (`operator_technician`, `main_staff`), with no media
persona at all. Reconciling the two is deferred until permission gates exist; until then no role is
shown in the UI (`docs/adr/0006-current-user-in-topbar.md`).

**Administrator**:
Full access, including Org/User/Role/Location/Device/Channel management and the Audit Log.

**Media Operator**:
Can create/manage Assets, Playlists, Publications, and Channels, assign existing Media Devices to Channels, and publish without any approval gate (Approval Workflow doesn't exist until Phase 3). Cannot manage Org/User/Role or register/edit Media Device master data, and cannot see the Audit Log.

**Viewer**:
Read-only across content and Monitoring. Cannot see the Audit Log.

**Asset** (Communication):
A reusable media file (image or video) stored in the central repository; MVP formats are JPG, PNG, and MP4 (H.264). Removing one sends it to Trash and hides it from new selections without breaking existing playback; permanent deletion is allowed only from Trash and remains blocked while a live reference or any Publish Job snapshot requires it. `docs/adr/0056-nested-feature-folders-and-trash.md`.
_Avoid_: Video, media file, content (when a specific entity is meant)
_Note_: Another App in this repo, Asset Intelligence, also has an entity called `Asset` with a different meaning — see the Asset Intelligence glossary entry below and `docs/adr/0023-asset-intelligence-feature-namespacing.md` for why neither was renamed.

**Asset** (Asset Intelligence):
An organization-wide physical asset (laptop, printer, NAS, or media-player hardware) owned end-to-end (register/track/manage/assign) by Asset Intelligence's Asset/IT Manager role — see `src/features/asset-intelligence/assets`. Deliberately shares the name `Asset` with Communication's media-file entity above rather than being renamed to something like `Equipment`, because the two are genuinely related: an Asset of category `media_player_device` is, once assigned, the same physical hardware Communication tracks as a `Device` (below) — see `docs/adr/0024-asset-device-cross-reference-model.md` for the `externalRef` cross-reference field. Namespaced as `features/asset-intelligence/*` (not `features/communication/assets`) to avoid a folder collision — `docs/adr/0034-feature-folders-nest-under-app.md` (originally a flat `ai-` prefix, `docs/adr/0023-asset-intelligence-feature-namespacing.md`). Scoped to three personas — Asset/IT Manager, Department Manager, Employee; its former CEO and Technician personas moved out when Thunder One was introduced — `docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`.

**Folder**:
A tenant-wide place for filing one kind of Communication content: Assets, Playlists and operator-facing Layouts each have their own Folder tree, nested to at most five levels. An item belongs to at most one Folder; an empty Folder can be deleted, while `Uncategorized` represents items with no Folder. `docs/adr/0056-nested-feature-folders-and-trash.md`.
_Avoid_: Tag (many-to-many, a different question and not built), shared content Folder (each feature has its own tree), `asset_folders` (that is Asset Intelligence's physical-asset table, unrelated)

**Trash**:
A virtual collection of soft-deleted Assets, Playlists or operator-facing Layouts, separate within each feature and never a Folder row. Restoring returns an item to its former Folder when possible or to `Uncategorized`; permanent deletion is an explicit, dependency-checked action available only from Trash. `docs/adr/0056-nested-feature-folders-and-trash.md`.
_Avoid_: Archive, Trash Folder

**Playlist**:
An ordered sequence of Assets, with per-item duration and transition settings. Has no scheduling or targeting responsibility of its own. Item duration and transition reach the screen together with the Playlist's play mode, repeat behavior and start position (ADR 0031); media fit, volume and failure handling remain stored intent that no player reads yet (ADR 0010). It carries a **Cover**, which is a reference to one of the Assets already in the Playlist (never a separately uploaded file) and falls back to the first item when none is picked, and a **creator**, recorded once at creation and never reassigned by later edits. Active/inactive remains its operational lifecycle; removing it from the library is the separate, reversible move to Trash.
_Avoid_: Schedule, rotation, Cover image (implies an uploaded file — a Cover is a pointer to a member Asset)

**UI vocabulary for Layout and Composition — read this before the next two entries**:
The operator-facing words are deliberately the inverse of the contract words, and both are correct in
their own place (`docs/adr/0052-merged-layout-authoring.md` §1). Operators, the PO and the UX mockups
call the content-carrying thing a **Layout** and the geometry-only thing a **Template**; the schema,
the API and this glossary call them **Composition** and **Layout**. Authoring happens on one page for
both.

| Operator sees | Contract / schema | Route |
|---|---|---|
| Layout | `media_core.compositions` | `/media-workspace/layouts` |
| Template | `media_core.layouts` (`kind = 'template'`) | `/media-workspace/layouts/templates` |
| — (private geometry, never named) | `media_core.layouts` (`kind = 'inline'`) | — |

Renaming the tables to match was considered and rejected; ADR 0052 §1 records why. When writing UI
strings use the left column, when writing code use the middle one, and never mix them in one sentence.

**Layout**:
A named, reusable screen geometry of up to four non-overlapping **Zones**, each expressed as a percentage of the display area. It carries geometry only — never content: content is bound per Zone on a **Composition** (below), which pairs one Layout with content, so one Layout can back many Compositions and the same menu-board geometry serves every branch with different content (`docs/adr/0049-composition-layout-with-content.md`). Zones may not overlap (there is no stacking order) and need not cover the whole display; uncovered area is the Layout's background colour. It declares an `aspect_ratio` that its percentages are measured against, a background colour for uncovered area, and optionally a `reference_resolution` — the pixel size it was drawn for, an authoring reference only, never a rendering constraint. Percentages carry **three decimal places**, because three equal columns across three monitors need 33.333% and at 5760 px wide one tenth of a percent is 5.76 px (`docs/adr/0050-wide-layouts-across-monitors.md`). A Zone keeps its identity across edits — renaming or resizing one updates it in place rather than replacing the set — and a Zone that any Composition still binds cannot be deleted. Fit against a Media Device is its **own advisory rule**, not the Channel one: orientation or aspect-ratio mismatch is shown before publishing but does not block preview or publish, while missing Device geometry is reported as unknown rather than silently treated as compatible (`docs/adr/0055-advisory-geometry-fit-and-player-recovery.md`). The Channel ↔ Device resolution rule remains separate. Lifecycle copies Playlist's: `active ↔ inactive`, no delete. A Layout may span several monitors driven by **one machine** — the geometry is still percentages, and the player window is positioned across the virtual desktop when configured to; several machines driving one image in step remains out of scope. `docs/adr/0044-multi-zone-layout.md`, `docs/adr/0050-wide-layouts-across-monitors.md`; player contract: `docs/layouts/contract-v2-zones.md`.
A Layout carries a `kind`: a **`template`** is named by an operator and offered when composing, an **`inline`** one is private geometry drawn inside a single Composition and named `comp:<uuid>` — the same split `playlists.kind` already makes for one-off content, and the reason a Composition can be authored without naming a Template first (`docs/adr/0052-merged-layout-authoring.md` §4). Selecting a Template always **references** it, never copies it; that is what keeps one menu-board geometry serving every branch, so editing it warns that every Composition using it will follow, and offers to fork a private copy instead (§3).
_Avoid_: Scene (the prior Aurora player nested a carousel of Scenes inside a Layout — deliberately not ported, because a Scene's own duration is scheduling and Schedule already owns that), Grid Layout / Custom Layout (superseded wording); note **Template** is now a real distinction — `layouts.kind`, and the operator-facing name for this entity — not a frontend constant

**Authoring Reference Resolution**:
The optional integer `width × height` a Layout was designed against, such as `3000x2000`. Each dimension accepts `100–99999`; zero, negatives and fractions are invalid. Width and height are the source of truth, orientation is derived (`width > height`) rather than stored, and the Layout's `aspect_ratio` is derived from them **reduced by GCD** — `1920x1080` is `16:9`, so a new Layout reads the same as one drawn before the field existed. Both `template` and `inline` Layouts use the same field, from different entry points: a Template's create form carries it with `1920x1080` preselected, other common presets and Custom, while an inline Layout opens straight onto the canvas at `1920x1080` and changes it in the inspector — ADR 0052 §4 exists so that nothing is asked before the canvas, and a later change costs nothing. The editor fits this logical artboard into the available workspace on both axes rather than creating a literal pixel-sized DOM canvas; rulers, guides and the inspector translate Zone percentages into reference pixels. Changing it preserves each Zone's percentage geometry: ratios are compared numerically, so a same-ratio scale change needs no warning, while an aspect-ratio change after Zones exist requires one confirmation that also identifies how many referencing Compositions will follow the shared Template change. Existing Layouts without a `reference_resolution` keep their declared `aspect_ratio`, remain editable and savable, and expose no pixel ruler until a resolution is supplied; no data migration is required. The value never binds the Layout to one Media Device or promises pixel-perfect browser output.
_Avoid_: Canvas size, target resolution, required resolution

**Playback Preview**:
A read-only browser simulation of a draft's geometry and timing, drawn in a quick modal with a **geometry selector** that reshapes its frame — the Authoring Reference Resolution in the editor, which has no target to narrow a Device list with, or a selected Media Device's reported shape, portrait included, in Publication step 5. That step defaults to the geometry its selected targets report; targets are grouped by their reported `WxH` into one **Target Geometry Profile** each rather than one preview per Device, and Devices with no reported geometry group as unknown. Preview frame shape resolves through `reference_resolution`, then the Layout's `aspect_ratio`, then `16:9`; therefore Ticket 20 can ship independently of Ticket 19, while reference-pixel labels remain unavailable until a resolution exists. A mismatch is rendered inside the target-shaped frame with an advisory warning that does not block preview or publish: percentage-based Zones stretch with the player's viewport exactly as they will on the Device, while content inside each Zone follows that Zone's `media_fit`; preview adds no Layout-level letterboxing. Every surface mounts one stage component and owns its own clock — the guarantee is that the same `t` gives the same frame, not that two windows tick together. Alongside the quick modal, **Open full preview** opens the same stage in a separate browser tab so the result is large enough to inspect and can be moved independently; saved work loads by Composition or Publication id, while only a dirty unsaved draft uses a live same-origin session that expires with the editor. Layout id is never a playback source because a Layout carries no items. Preview never binds the Layout to one Device and does not certify physical pixels, bezels, colour, decoding capacity, or playback on that Device.
_Avoid_: Device rehearsal, screen capture, pixel-perfect preview

**Target Geometry Profile**:
A preview-only grouping of selected Media Devices that report the same `WxH` — which fixes orientation too, since orientation is `width > height` and not a separate key. It keeps multi-target preview choices compact and shows how many Devices share that geometry; it is derived at runtime and is not a persisted Device group or Layout binding.
_Avoid_: Device profile, target resolution, screen preset

**Composition**:
A named, reusable pairing of one Layout with content for each of its Zones — the same shape as a Playlist, one level up: it decides what plays where, and nothing about when or where it airs. It **is** the Layout area as the operator meets it: one list at `/media-workspace/layouts` and one editor that draws Zones and fills them with content on the same canvas, with the geometry-only Template list one level down (`docs/adr/0052-merged-layout-authoring.md` §5). Its operational lifecycle is `draft → active ↔ inactive`; removing it from the library is the separate, reversible move to Trash. A `draft` may be saved with Zones still unbound; activating requires every Zone of its Layout to be bound, and a Publication may select only an `active` one. A Zone always points at a Playlist — picking loose assets for a Zone creates an implicit `inline` Playlist owned by that Zone, so ordering, per-item duration, approval rules and asset-delete protection are inherited rather than reimplemented. A Zone's own play mode / repeat / start position override the bound Playlist's. Changing a Composition's Layout clears every binding, behind a confirmation. A Publication that uses a Composition materializes both the geometry and every Zone's items into its snapshot, so editing the Composition never reshapes a screen that is already airing — instead the Publication is flagged as **drifted**, compared three levels deep (the Composition's revision, the Layout's `updated_at`, and each bound Playlist's revision), with re-publish as the action. Because one poll response merges every in-window equal-priority Publication into a single loop, activating is **blocked** when it overlaps an equal-priority Publication on a shared Media Device and either side uses a Composition; higher-priority preemption still takes the whole screen. Publishing is also refused to any Media Device that has not reported the `multi_zone_v1` capability, or reports fewer concurrent video Zones than the Layout needs. `docs/adr/0049-composition-layout-with-content.md`; depends on `docs/adr/0045-publication-snapshot-materialization.md`.
_Avoid_: Layout **in code** (that is the geometry alone) — but in UI strings "Layout" is exactly the right word for a Composition; see the vocabulary table above. Also avoid: Layout Content, Scene

**Zone**:
One rectangular region of a Layout, with its own content and playback loop, and its own playback settings — play mode, repeat and start position belong to a Zone, so a looping main Zone can sit beside a play-once ticker. A Zone has no `role` and no `kind`: its free-text `name` is its only label, and what distinguishes a ticker from a main Zone is its geometry and its own playback settings. Its content is bound on a Composition, not on the Zone itself. A Publication with no Layout still has exactly one implicit Zone covering the whole screen, so nothing in the system has to special-case "no zones". Zone loops run independently and need not share a duration — Synchronized Playback's phase arithmetic (`docs/adr/0043-schedule-anchored-playback-loop.md`) is evaluated per Zone against that Zone's own loop, using the one `loop_anchor_at` the response carries for all of them, so a synchronized Channel stays aligned in every Zone. A higher-priority Publication suppresses the entire screen rather than preempting a single Zone, so Schedule and Publication Priority stay whole-screen concepts. Proof-of-play records the **snapshot** Zone id, not the Layout's — a Layout can be edited after publish, so only the snapshot identifies the geometry that actually aired; full-screen playback leaves it null.
_Avoid_: Region, Panel, Component (Aurora's term), Widget (live-data content such as weather or news is not in scope)

**Publication**:
A publishable package that binds an immutable snapshot of content (single Asset, Playlist, or Composition — captured at publish time) to one or more target Channels (many-to-many) and a Schedule. The snapshot means editing the source Playlist later never affects an already-published Publication's running Jobs. _Known gap as of 2026-08-25: this snapshot is not implemented. `media_job_poll` joins `media_core.playlist_items` live through `publications.playlist_id`, and `media_publication_activate` pins only `file_version_no` — writing it back onto the shared Playlist rows, so one Publication's activation mutates state another Publication reads. Editing a Playlist therefore does change what is airing, within one poll cycle. `docs/adr/0045-publication-snapshot-materialization.md` builds the missing machinery._ "Republishing" edits the same Publication in place (same ID) and takes a fresh snapshot, generating new Jobs — it does not create a new Publication. Full labeled version history/rollback is out of scope until Phase 3 (§8.6); Phase 1 only guarantees this snapshot stability. This is where "what plays where and when" is actually decided — Playlist and Schedule stay decoupled from targeting. A Publication has no single rollup delivery status of its own — only its constituent Publish Jobs (one per Channel×Device) carry delivery status, and they can diverge (e.g. one Channel "Playing" while another is "Failed" and gets retried independently). Its own lifecycle status is entirely separate from Job delivery status: `Draft` (created, not scheduled/activated) → `Scheduled` (valid future Schedule, waiting) → `Active` (within its active window) → `Ended` (completed normally) or `Cancelled` (stopped before completion). Only three of those five are *stored* — `Draft`, `Active`, `Cancelled`, each recording an irreversible operator action; `Scheduled` and `Ended` are derived from the Schedule window whenever the Publication is read, so they can never go stale (`docs/adr/0004-publication-status-derived-not-stored.md`). "Is it airing right this second" is a further, separate question — a weekly Publication is still `Active` on a day it does not play. A Publication can be `Active` while one of its Jobs is `Failed` — the two status vocabularies never merge.
While a Publication is a `Draft`, two operators editing it concurrently is a real possibility: the second save is *refused* rather than silently overwriting the first, and the operator chooses between reloading and deliberately overwriting (`docs/adr/0003-draft-optimistic-locking.md`). Being told "this changed elsewhere" is therefore part of the Draft experience, not an error condition.
_Avoid_: Campaign (Campaign is a later, larger grouping of Publications — not yet in scope)

**Publication Priority**:
The precedence tier that decides airtime when Publications overlap: `urgent` > `high` > `normal` > `low`. A higher tier fully suppresses lower tiers during the overlap, while Publications at the same tier share the playback loop.
_Avoid_: Urgency, display order

**Schedule Conflict**:
An overlap where Publications target at least one of the same Media Devices during the same Schedule window. It is a warning when the new Publication has equal or higher Publication Priority, and a publish blocker when any overlapping Publication has higher priority.
_Avoid_: Revision conflict, visual overlay

**Schedule**:
The timing rules (start/end date-time, recurrence) attached to a Publication. A standalone concept, not embedded in Playlist. Carries a single explicit `timezone` (set once at schedule creation, defaults to `Asia/Bangkok`) — this is the direct evaluation source of truth: `media_job_poll` evaluates recurrence (day-of-week, daily start/end) against `now() AT TIME ZONE schedules.timezone` with no further resolution step. There is no per-Channel or per-Location time zone — `public.locations` exists and `media_core.channels.location_id` references it (`channels_location_id_fkey`, `ON DELETE SET NULL`), but neither table carries a time zone — so every Channel targeted by a multi-Channel Publication fires at the same instant, evaluated in the one time zone the Schedule was given. A Publication spanning Locations in different real-world time zones does *not* fire at "local business hours everywhere"; it fires at whatever wall-clock time the Schedule's single timezone maps to for each Channel.
_Known gap, not yet resolved: if Thunder One ever needs per-Location evaluation (a multi-timezone tenant), `schedules.timezone` would need to stop being the sole input — the same single-timezone assumption is called out explicitly in `Thunder_Core/supabase/migrations/069_media_poll_window_conflicts_and_airtime_report.sql` (the `ponytail: recurrence/time-window overlap...` comment on `media_schedule_conflicts`)._

**Synchronized Playback**:
An opt-in Channel policy under which every Media Device in that Channel occupies the same position in the playback loop at the same moment, provided the Devices hold the same content. It is off by default and an operator turns it on per Channel; the synchronization boundary is the Channel and nothing larger. It is not a stated skew budget, not frame-accurate video-wall synchronization, and not a promise that content changes reach the Devices simultaneously — after a Publication is activated or cancelled, or a Schedule's daily window opens or closes, members converge on the new loop within roughly a minute rather than instantly. It carries no readiness state and no health state of its own: playback is never held back waiting for another Device. Because a Publication may target a Media Device directly and bypass the Channel, a Device can hold content its Channel peers do not; activating such a Publication against a synchronized Channel is blocked, while conflicts that predate the Channel being synchronized are tolerated and reported rather than blocked. `docs/adr/0042-epoch-phase-synchronized-playback.md` (supersedes `docs/adr/0041-server-anchored-synchronized-playback.md`).
_Avoid_: Simultaneous delivery, frame sync, Sync Group, Channel Group (no synchronization boundary above Channel exists), Sync Degraded (there is no synchronization-health state)

**Channel**:
A business-facing publishing destination containing one or more equal Media Devices that receive the same media and Schedule. Its lifecycle is `Draft → Active ↔ Inactive`; once activated it never returns to Draft. A Media Device may be prepared in multiple Draft Channels but is reserved by only one Active Channel. It has no primary/backup or failover relationship between members. Removing or moving a Media Device is blocked while an Active or Scheduled Publication still targets it. Membership and exclusivity: `docs/adr/0030-channel-endpoint-membership-and-active-exclusivity.md`; lifecycle, retirement and concurrency: `docs/adr/0038-channel-lifecycle-retirement-and-concurrency.md`; the display expectation and the target-snapshot guard: `docs/adr/0039-channel-display-expectation-and-target-snapshot.md`.
_Avoid_: Screen (ambiguous between Channel and Media Device), Player, Primary Device, Backup Device

**Channel Category**:
The delivery family of a Channel: `DOOH`, `In-store`, `Online`, or `Social`. The current phase allows creating only DOOH and In-store Channels; Online and Social are reserved for future connector-backed endpoints.
_Avoid_: Channel Type, Device Type

**Channel Type**:
A controlled business-display subtype within a Channel Category, such as `LED Display` or `Menu Board`. It describes the destination's use, not its delivery family or hardware model.
_Avoid_: Channel Category, Device Type

**Channel Health**:
The aggregate operating condition of a Channel's Media Devices. `Degraded` exists only at Channel level and means at least one member is Offline while another is Online or Warning; individual Media Devices remain Online, Warning, or Offline. Derived on read, never stored — `docs/adr/0035-channel-monitoring-policy-alerts-and-remote-operations.md`.
_Avoid_: Channel lifecycle, Device Health

**Device**:
The generic physical-equipment concept used outside Media Workspace. Do not use this unqualified term for a Channel endpoint because the platform also has a separate Device registry.
_Avoid_: Media Device

**Media Device**:
The physical player endpoint that receives and plays Media Workspace content. In this phase its canonical identity follows the existing Media runtime identity rather than the platform Device registry; unifying those identities remains a separate cross-context decision (`docs/adr/0030-channel-endpoint-membership-and-active-exclusivity.md`, `docs/adr/0024-asset-device-cross-reference-model.md`). A Channel is what operators target, while a Media Device is what downloads and plays. On pairing, it receives a long-lived token scoped to one Organization and Media Device; deregistration invalidates that token on subsequent player requests.
_Avoid_: Device (ambiguous across contexts), Screen, Player

**Publish Job**:
A technical delivery run generated for one Publication. Its target rows track download, delivery, and playback independently of the Publication lifecycle. `delivered` remains in progress at the parent Job level until every target reaches `playing`; a failed target can be reset by Retry without creating a second Publication.

**Publish Job Target**:
The per-Media-Device delivery state inside a Publish Job. It owns `pending → downloading → delivered → playing` or `failed`, retry generation (`retry_count`), and per-asset `file_statuses`. Delivery Progress reads these rows as its source of truth: `delivered|playing` proves Media Delivered, while only `playing` proves Playback Confirmed.

**Publication Download Report**:
The success-only player callback sent after every distinct Asset in one Publication snapshot is locally available. It records file diagnostics on the current Publish Job Target and advances that target to `delivered`; it never replaces the existing `playing` or `failed` ACK paths. `downloaded=false` means the player reused a valid cache entry and is still a successful delivery. `checksum=null` with `verified=false` means verification was unavailable, not that it failed.

**Edge Node** (Phase 2+):
A per-Location (or per-region) cache layer that Devices fetch Asset bytes from instead of the origin, to accelerate delivery and provide local resilience when the origin is unreachable. Revalidates cached Assets against the origin (e.g. hash/ETag comparison) to detect updates. Does not change job control flow — Devices still receive Publish Job notifications via the heartbeat/poll cycle described under Publish Job; only asset *bytes* are edge-served.
_Avoid_: CDN (implies a third-party service; this may be self-hosted), edge compute/inference (out of scope — no decisioning logic runs at the edge, only caching)

**Flagged ambiguities**:
- The existing codebase scaffold (`src/features/videos`, `src/features/screens`, `src/features/playlists`) predates this glossary and conflicts with it: `videos` should become `assets`, `screens` should split into `channels` + `devices`, and `playlists` (currently doubling as scheduling) should narrow to pure ordered-asset-sequences with a new `publications` feature owning the scheduling/targeting role. Resolved 2026-07-23: the plan's glossary is authoritative; the scaffold will be renamed to match, not the other way around.
- Asset Intelligence (a second App added to this repo, originally switched via a two-item App Switcher dropdown — `docs/adr/0022-app-switcher-multi-app-shell.md`) introduces its own `Asset` entity, colliding in name with Communication's existing `Asset` (media file). Resolved 2026-08-18: both meanings are kept — the name collision reflects a real relationship (Asset Intelligence's `media_player_device` category assets are Communication's Devices, see `docs/adr/0024-asset-device-cross-reference-model.md`), so neither entity is renamed. Disambiguated instead by feature-folder namespace: `src/features/communication/assets` vs. `src/features/asset-intelligence/assets` — originally a flat `ai-` prefix (`docs/adr/0023-asset-intelligence-feature-namespacing.md`), now App-level nesting (`docs/adr/0034-feature-folders-nest-under-app.md`, 2026-08-20).
- Introducing the Thunder One shell (2026-08-20) means `/` now belongs to Thunder One, not Communication (formerly "Media Workspace") — Communication moves to `/communication`. Asset Intelligence narrows from 6 personas to 3 (Asset/IT Manager, Department Manager, Employee); its former CEO and Technician personas move out — CEO's function is absorbed into Thunder One's shell-level **Mission Control**, and Technician (together with Thunder Care) moves wholesale into a new **ThunderCare** App. One deliberate overlap, not a bug: Thunder One's shell-level **My Work** (cross-app rollup) and ThunderCare's Technician-persona home page (also labeled "My Work", single-app) share a label on purpose — different scope, same name. `docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`.
