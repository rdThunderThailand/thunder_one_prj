# Spec — Composition, wide Layouts, overlap block, `zones[]` payload, preview

**Written** 2026-08-26 (replaces `spec-per-zone-content.md`, written against the superseded model) ·
repos: `thunder_one_prj` + `Thunder_Core` · branch `feat/layout`
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` ·
`docs/adr/0050-wide-layouts-across-monitors.md` · `docs/adr/0051-pre-publish-preview.md` ·
`docs/adr/0044-multi-zone-layout.md` §2–§12 · `docs/adr/0045-publication-snapshot-materialization.md`
**Its frontend flow is superseded by ADR 0052 / ticket 15.** Everything below about *entities, RPCs,
snapshots, overlap block and the `zones[]` payload* still stands. (The capability gate that this
document originally carried is **deferred by ADR 0054** and is not built in this phase.) What no longer
holds is the **two-page authoring shape**: a separate `/media-workspace/compositions` list and editor,
and picking a Layout from a dropdown beside the wireframe. Those merge into one page at
`/media-workspace/layouts` — read `docs/adr/0052-merged-layout-authoring.md` before building any
screen from this document.

**Superseded inputs — do not build from these:** ADR 0044 §1, §13 · ADR 0048 (in full) ·
`spec-per-zone-content.md` · the `publication_zones` / `publications.layout_id` /
`media_publication_set_zones` model in the three uncommitted `Thunder_Core` migrations.

## Problem Statement

An operator can build a Layout — pick a template, name the Zones, save it, archive it — and then
nothing. There is no way to say what plays in each Zone, no way to publish a Layout to a screen, and
no way for a screen to receive one.

A first attempt bound content per Zone inside step 2 of the Publication wizard (ADR 0048). It was
built, browser-tested on 2026-08-26, and rejected on two counts. The PO expects a Layout to be an
authored, named thing that already carries its content — the same shape as a Playlist — not an empty
frame that only becomes meaningful halfway through a five-step wizard. And it hit a structural gate:
`canSelectPlaylist(type)` gates content on the Publication's single scalar `publication_type`, so one
Publication cannot hold a Playlist in one Zone and images in another. ADR 0049 resolves both by
putting content on a new entity, the **Composition**.

Five further failure modes sit behind shipping this, and all of them are invisible until a screen is
already wrong. **Four are closed in the current phase. Device decoding capacity is knowingly deferred
by ADR 0054 and remains a documented rollout risk** — see *Known limitation* under Further Notes:

- Editing a Layout today deletes and re-inserts every Zone row, so `layout_zones.id` is not stable.
  Anything that references a Zone loses its reference the next time somebody renames one.
- Zone geometry is stored to one decimal place. Three equal columns need 33.333%; at 5760 px wide,
  0.1% is 5.76 px — enough to cut a face at a monitor bezel, with no error anywhere.
- A Publication built on a Layout could be sent to a Media Device that cannot render more than one
  Zone, or cannot decode two videos at once. The operator finds out by looking at the screen.
- Two Publications of equal priority overlapping on one Media Device is only a warning today. With a
  Layout, "both are airing" has no coherent meaning — one whole-screen composition wins arbitrarily.
- The job payload has one shape, flat `slots[]`. A player receiving Layout content in that shape
  plays every Zone's content full-screen, stacked.

And an operator publishes all of it without ever having seen it play: `PreviewPanel.tsx:20` is a
button with no `onClick`.

## Solution

A **Composition** is a named, reusable pairing of one Layout with content for each of its Zones. It
lives in the Layout area of the product with its own list page and editor, and copies Playlist's
lifecycle (`draft → active ↔ inactive`, no delete). The operator picks a Layout, clicks a Zone in the
wireframe, and binds a Playlist or a set of assets to it, Zone by Zone, with per-Zone playback
settings — before and independently of any Publication.

Layout is untouched: still geometry only, still shared, so one menu-board Layout backs many
Compositions with different content per branch. That reuse case is the reason content does not live
on `layouts` directly.

A Publication then picks one Composition exactly as it picks one Playlist: `publication_type` gains
`'composition'` at step 1, and step 2 shows a Composition picker. The Full screen / Layout mode
switch inside step 2 is removed — the choice belongs at step 1 with every other "what kind of content
is this" choice, and content gating stays on one scalar dimension.

Because the Layout's Zones are now referenced by long-lived rows, `media_layout_upsert` stops being a
wholesale replace and becomes a diff that keeps Zone ids, and a Zone bound by any Composition cannot
be deleted. Geometry gains a decimal place at every one of the four points on its path, so a wide
Layout across three monitors can be expressed exactly.

Targets are chosen at step 3 and the Schedule at step 4, so the checks that need both are raised
where they can be answered: step 3 warns when a chosen Channel contains a Media Device whose
resolution or orientation does not fit this Layout (the geometry fit rule, ADR 0044 §4), and step 5
blocks publishing on an equal-priority overlap with another composition Publication on the same
Media Device. **Device decoding capacity is not among them** — ADR 0054 defers that check until a
player build reports capability and the number has been measured on real hardware.

At publish, the composition is frozen into the Publication snapshot together with the revisions of
everything it materialized, so a later edit surfaces as a **drift indicator** offering re-publish
rather than silently reshaping an airing screen. Screens polling a composition Publication receive a
`zones[]` payload; every other Publication keeps receiving the flat `slots[]` it receives today.

One preview component, mounted from the Playlist editor, the Composition editor and step 5, plays the
draft back at its real proportions with every Zone looping on its own length from a shared clock.

## User Stories

**Composition**

1. As a Media Operator, I want a Composition list page beside Playlists, so that a split-screen
   composition is something I author and find, not something buried in a wizard.
2. As a Media Operator, I want to name a Composition and pick one of my active Layouts for it, so
   that the geometry my team designed is reused rather than redrawn.
3. As a Media Operator, I want archived (inactive) Layouts kept out of the picker, so that I cannot
   build on geometry my team has retired.
4. As a Media Operator, I want the picked Layout drawn as a wireframe with its Zones labelled, so
   that I can tell the sidebar from the ticker before I bind anything.
5. As a Media Operator, I want to select a Zone in the wireframe and bind content to it, so that
   "what plays where" is a direct manipulation rather than a form field.
6. As a Media Operator, I want to bind an existing Playlist to a Zone, so that a Zone I refresh
   weekly is maintained in one place.
7. As a Media Operator, I want to bind a set of picked assets to a Zone, so that a one-off Zone does
   not force me to create and name a Playlist first.
8. As a Media Operator, I want per-asset duration and transition inside a Zone, so that a ticker Zone
   can run faster than the main Zone.
9. As a Media Operator, I want per-Zone playback settings (play mode, repeat, start from) that
   override the bound Playlist's own, so that a looping main Zone can sit beside a play-once ticker
   without duplicating the Playlist.
10. As a Media Operator, I want each Zone to show its own total duration, so that I can see that my
    sidebar is 40 seconds against a 5-minute main Zone.
11. As a Media Operator, I want to save a Composition with Zones still unbound, so that composing
    across two sittings is a normal thing to do.
12. As a Media Operator, I want an unbound Zone called out clearly and activation refused while one
    remains, so that I cannot publish a Layout with a black rectangle on it.
13. As a Media Operator, I want to change a Composition's Layout, with a confirmation telling me it
    clears every binding, so that a change of mind is possible but never silent.
14. As a Media Operator, I want an active Composition to refuse a change that would make it
    incomplete, so that something a Publication depends on cannot be hollowed out underneath it.
15. As a Media Operator, I want to retire a Composition to `inactive` rather than delete it, so that
    the record of what was published survives.

**Layout**

16. As a Media Operator, I want renaming or resizing a Zone to keep that Zone's identity, so that
    editing a Layout does not wipe the Compositions built on it.
17. As a Media Operator, I want deleting a Zone that a Composition still uses to be refused by name,
    so that I learn which Compositions to fix instead of discovering an empty rectangle later.
18. As a Media Operator, I want to type Zone percentages to three decimal places, so that three equal
    columns across three monitors land exactly on the bezels.
19. As a Media Operator, I want to record the resolution a Layout was drawn for, so that the editor
    can tell me a Zone is "1920 × 1080 — exactly one monitor" instead of a bare percentage.
20. As a Media Operator, I want guide lines where the monitor seams fall, so that I can see a bezel
    the browser cannot draw.
21. As a Media Operator, I want an "even split into N columns" action, so that the leftover from
    33.333 × 3 is handed out deliberately rather than left as a background strip.
22. As a Media Operator, I want an unparseable aspect ratio reported as an error, so that `5760:1080`
    does not silently become a 16:9 canvas.

**Publication**

23. As a Media Operator, I want to choose "Layout" as a publication type at step 1 alongside Playlist,
    so that the kind of content is decided in one place.
24. As a Media Operator, I want step 2 to present only a Composition picker for that type, so that
    there is nothing to bind and nothing to get incomplete at publish time.
25. As a Media Operator, I want only active Compositions offered, so that a retired composition cannot
    be published again.
26. As a Media Operator, I want everything else about the wizard — full screen, playlists, assets — to
    behave exactly as it does today when I do not choose Layout.
27. As a Media Operator, I want step 5 to show me the composition I am about to publish, Zone by Zone,
    so that Review actually reviews the thing being published.
28. As a Media Operator, I want publishing to freeze the geometry and every Zone's items as they are
    at that moment, so that a colleague editing afterwards cannot reshape a screen that is airing.
29. As a Media Operator, I want to be told when the Composition, its Layout, or any Playlist inside it
    has changed since I published, and offered re-publish, so that "update the menu" reaches the
    screen deliberately.
30. As a Media Operator, I want to republish in place, so that correcting a Zone does not create a
    second Publication.

**Gates**

> **Stories 31–33 are deferred by ADR 0054 and are not built in this phase.** They keep their numbers
> so cross-references stay valid and the requirement is not lost:
> *31 — step 3 warns when a selected Channel holds a Media Device that cannot render this Layout;
> 32 — a Device that has never reported counts as unable; 33 — step 5 and the server both refuse an
> incapable target.* Nothing checks device decoding capacity in this phase. The geometry fit rule at
> step 3 and the equal-priority overlap block at step 5 are unaffected and remain in scope.

34. As a Media Operator, I want step 5 to refuse to publish when an equal-priority Publication already
    overlaps this one on a targeted Media Device and either side uses a Layout, naming the other
    Publication and its window.
35. As a Media Operator, I want a differing-priority overlap to stay the advisory warning it is today,
    so that the existing override behaviour is not tightened underneath me.

**Preview**

36. As a Media Operator, I want to watch a Composition play before I publish it, at the real
    proportions, so that I can see the sidebar restart fifteen times inside one main loop.
37. As a Media Operator, I want the same preview for a plain Playlist, so that there is one thing to
    learn.
38. As a Media Operator, I want a scrubber and 2× / 4× speed, so that a five-minute loop is reviewable
    in less than five minutes.
39. As a Media Operator, I want unapproved or missing assets drawn as marked placeholders, so that I
    can see why something will not air instead of not seeing it at all.
40. As a Media Operator, I want to be told when the real screen will merge other Publications into the
    same loop, so that a preview shown alone does not mislead me.

**Player**

41. As a Media Device, I want a Publication without a Composition to keep returning the flat `slots[]`
    I already understand, so that an un-upgraded player keeps working indefinitely.
42. As a Media Device, I want a composition Publication to return `zones[]` with geometry, loop
    duration and its own `slots[]` per Zone, so that I can compose the screen without resolving
    anything.
43. As a Media Device, I want to report my rendering capabilities when I register my profile, so that
    the fleet's real capacity can be measured before anything is gated on it. *(Deferred groundwork:
    ticket 07 built the storage and the argument; ADR 0054 means nothing reads the value yet.)*
44. As a Media Device, I want the heartbeat to tell me my profile is required when I have never
    reported capabilities, so that I know to send it without being reconfigured.
45. As a Media Device driving three monitors, I want the option to span the virtual desktop, so that
    the size I report is the size of the surface I actually paint.
46. As a Media Operator, I want proof-of-play to record which Zone an asset aired in, so that a
    sidebar impression is not counted as a full-screen one.

## Implementation Decisions

### Data model (`Thunder_Core`, migrations)

Per ADR 0049 §1, §2 and ADR 0050 §1, §2. The three uncommitted zone migrations were never applied to
either environment, so they are rewritten **in place** rather than layered over.

```
media_core.compositions
  id, tenant_id, name, layout_id, status, revision, metadata, created_at, updated_at
  status CHECK (draft | active | inactive)          -- copies playlists_status_check
  UNIQUE (tenant_id, name)

media_core.composition_zones
  id, tenant_id, composition_id,
  layout_zone_id  NOT NULL REFERENCES layout_zones  ON DELETE RESTRICT
  playlist_id     NOT NULL REFERENCES playlists     ON DELETE RESTRICT
  playback jsonb                                     -- same CHECK as publication_snapshot_zones
  UNIQUE (composition_id, layout_zone_id)
```

There is no `position` column: Zone order is `layout_zones.position`, read by join.

- `media_core.publications` gains `composition_id uuid NULL` referencing `compositions(id)`. The
  `publication_type` CHECK widens to include `'composition'` — in the table constraint **and** in the
  hardcoded `IF p_publication_type NOT IN (...)` copy inside `media_publication_upsert`.
- `layout_zones.role` and `publication_snapshot_zones.role` are dropped.
- `layout_zones` and `publication_snapshot_zones` geometry columns both become `numeric(6,3)`. They
  are different types today (`numeric(4,1)` and `numeric(5,2)`); the snapshot one is what the player
  reads, so leaving it caps the feature regardless of the other.
- `layouts` gains `reference_resolution varchar NULL CHECK (~ '^[0-9]{3,5}x[0-9]{3,5}$')`.
- `UNIQUE (layout_id, position)` on `layout_zones` is dropped and recreated
  `DEFERRABLE INITIALLY DEFERRED` — a diff that reorders two Zones violates it mid-statement, and
  `SET CONSTRAINTS` cannot defer a constraint not declared deferrable.
- `public.assets` gains `player_capabilities jsonb NULL` — **deferred groundwork**. It stores
  whatever a player reports and **no publish semantics read it** (ADR 0054, superseding ADR 0044
  §11's "NULL is a publish failure"). Note `public.assets` — Media Devices are `public.assets` rows
  per migration `096`, not `media_core.assets`.
- The snapshot records what it materialized from: `composition_revision`, `layout_updated_at`, and one
  `playlist_revision` per snapshot Zone.

Migration rules that apply to every function touched here: `DROP FUNCTION` the exact old signature
before `CREATE` when arguments change; `REVOKE ... FROM PUBLIC, anon, authenticated` then `GRANT` to
`service_role` after every `CREATE FUNCTION` — `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC` and
re-`GRANT`ing alone does not close it; verify with `has_function_privilege` after apply; tenant
isolation is filtered inside the RPC, not by RLS.

**Every apply to production is R0, including the additive ones.** Rehearse the whole set on `develop`
(`ftfmokgphewzyxzwjitv`, a full data clone) before production (`sfiefevtxalqjizdkcsw`).

### RPCs

- **`media_layout_upsert` becomes a diff** (ADR 0049 §9). A Zone arriving with a known `id` is updated
  in place; without one, inserted; a known `id` absent from the payload is deleted, and refused with a
  message naming the Compositions if any `composition_zones` row references it. `ROUND(…, 1)` becomes
  `ROUND(…, 3)`, and **the rounding moves ahead of the overlap and bounds checks** — today they read
  `p_zones` raw and the rounding happens at the `INSERT`, so the values validated are not the values
  stored. The overlap check runs against the post-diff, post-rounding Zone set. It also accepts and
  returns `reference_resolution`.
- **New `media_composition_upsert`** — creates or updates name / layout / metadata under
  `compositions.revision` as an optimistic lock. Changing `layout_id` deletes every
  `composition_zones` row of that Composition in the same transaction (the UI confirms first, §8), and
  is refused outright while the Composition is `active`.
- **New `media_composition_set_zones`** — replaces the whole binding set for one Composition in one
  transaction. Rejects a Zone that does not belong to the Composition's Layout and a Playlist from
  another tenant. It does **not** require completeness: a `draft` Composition may be saved
  half-bound. It refuses to leave an `active` Composition incomplete.
- **New `media_composition_set_status`** — `draft → active` requires a binding for every Zone of the
  Layout, checked in the same transaction. `active ↔ inactive` is free. There is no delete.
- **`media_playlist_upsert` gains an inline create path** yielding `kind = 'inline'`,
  `status = 'active'`, named after its Composition and Zone. It currently forces `kind = 'user'` on
  create, which would surface every Zone's implicit Playlist in the operator's own Playlist list.
- **`media_playlist_delete`** gains a count over `composition_zones`, raising
  `'Invalid input: playlist is used by % composition(s)'`. Without it a bound saved Playlist passes
  the existing `publications.playlist_id` guard and then hits a raw FK violation, which the route
  masks as a 500 because it lacks the `Invalid input:` / `not found:` prefix the passthrough matches.
- **`media_publication_upsert`** gains `p_composition_id uuid DEFAULT NULL` and enforces ADR 0049 §12's
  invariants. Its 17-argument signature must be dropped by exact signature first — `CREATE OR REPLACE`
  with an added parameter creates a second overload and every existing call then fails as ambiguous.
  The exact `DROP FUNCTION` statement is in ADR 0049 §12.
- **`media_publication_set_content`** rejects `publication_type = 'composition'` explicitly rather than
  falling through — a composition Publication's content does not live on the Publication.
- **`media_publication_duplicate`** **shares** `composition_id` for a composition Publication instead of
  minting a fresh `pub:<uuid>` Playlist as it does for the playlist type. A Composition is reusable by
  design, and the duplicate would otherwise carry no content at all.
- **`media_publication_activate`** writes the snapshot from `composition_zones`: one
  `publication_snapshot_zones` row per binding with geometry read from `layout_zones` at that instant
  and `source_layout_zone_id` recorded, then each Zone's Playlist expanded into
  `publication_snapshot_items` with `file_version_no` pinned (ADR 0045 §4) and
  `COALESCE(pi.duration_seconds, ma.duration_seconds)` as it does today. It records
  `composition_revision`, `layout_updated_at` and each Zone's `playlist_revision`. It enforces the
  Layout ↔ target geometry fit rule (ADR 0044 §4, ticket 16) against the resolved target set. A Publication with
  no `composition_id` continues to produce the single implicit full-screen Zone of ADR 0045 §1. It
  refuses an incomplete Composition, a non-`active` Composition, a Composition from another tenant,
  and re-runs the overlap block inside the same transaction — the UI checks are advisory, the RPC is
  the enforcement point. It runs **no** device-capacity check (ADR 0054).
- **`media_device_profile_set`** gains a `capabilities` argument stored on `assets.player_capabilities`,
  carrying at least `multi_zone_v1` and `max_video_zones` — *deferred groundwork, written but never
  read by a publish decision (ADR 0054).*
- **`media_heartbeat`** returns `profile_required` = true when the calling Device's
  `player_capabilities IS NULL`, and does not otherwise change its response — *deferred groundwork:
  it prompts a Device to report, which gates nothing and builds the evidence enforcement will need.*
- **`media_schedule_conflicts`** gains a blocking outcome distinct from the existing advisory one:
  equal priority + overlapping window + same Media Device + either side carries a Composition.
  Differing priorities keep today's `would_suppress` / `would_be_suppressed` shape untouched.
- **`media_job_poll`** branches on the snapshot: no Composition → `slots[]`, byte-identical to today;
  with one → `zones[]`, each entry carrying its geometry (percent), `loop_duration_seconds` and its own
  `slots[]`. `loop_anchor_at` stays a single top-level value shared by every Zone (ADR 0044 §10).
  `zone_id` is never added to the flat `slots[]`.

### API routes (`Thunder_Core`)

- `GET|POST /media/compositions`, `GET|PUT /media/compositions/:id`,
  `PUT /media/compositions/:id/zones`, `PUT /media/compositions/:id/status` → the four RPCs above.
  Zod validates shape only; membership and tenancy stay in the RPC, matching the existing loose-zod
  convention.
- The jobs route must sign asset URLs by walking `result.zones[].slots` as well as `result.slots`, or
  every asset in a zoned payload arrives with `file.url = null`.
- Existing `PUT /media/publications/:id/content` is not modified.

### Frontend (`thunder_one_prj`)

- Routes live under `src/app/(dashboard)/(application)/media-workspace/compositions` —
  `page.tsx`, `create/page.tsx`, `[compositionId]/page.tsx` — mirroring `playlists` and `layouts`.
  (The empty `communication/layouts` directories are leftovers from the route migration and are not
  the pattern to copy.) Feature code lives in
  `src/features/media-workspace/compositions`, mirroring `layouts`: list filtering, list url state and
  status display are the same shapes and the same check-file style.
- The Composition editor reuses `LayoutWireframe` as its Zone selector and the existing content picker
  scoped to the selected Zone. It does not fork a second wireframe.
- A pure module owns Composition rules: which Zones are unbound, per-Zone duration totals, whether the
  binding set covers the Layout, and the draft → payload mapping. Plain functions over plain data, no
  React. **`zone-bindings.ts` from the superseded model is rewritten here, not extended** —
  `hasLayoutZoneDrift` in particular is deleted, not moved (see drift below).
- The Publication wizard: step 1 offers the type, step 2 renders a Composition picker for it. The
  Full screen / Layout switch built for the superseded model is removed. `publish-eligibility.ts`,
  `step-validation.ts` and `dropMismatchedItems` in `content-selection.ts` each gain **one**
  `composition` branch beside their existing `playlist` branch. `publish-eligibility.ts` must be
  changed rather than skipped: its `else` falls through to the assets path, where a composition
  Publication has no `assetItems` and would be marked ineligible to publish.
- The draft store's persisted key version is bumped and older drafts are dropped, not migrated,
  following the precedent already in that store.
- Drift is a revision comparison, three levels deep — `composition_revision`, `layouts.updated_at`,
  and one `playlist_revision` per Zone. The third level is the one that matters most: editing the
  items of a Playlist a Zone points at is what "update the menu" means, and `media_playlist_set_items`
  already increments `revision` on every write, so it needs no backend change.
- `geometry.ts`: `toTenths` becomes `toThousandths` (`Math.round(value * 1000)`), the hardcoded `1000`
  bound in `validateZones` becomes `100000`, `roundPercent` divides by 1000, and `parseAspectRatio`'s
  `/^(\d{1,2}):(\d{1,2})$/` widens and reports an unparseable value as a validation error instead of
  silently returning `[16, 9]`. `toTenths` is not merely `roundPercent`'s helper — it is the basis of
  `rectsOverlap` and of the bounds test, so leaving it makes 33.333 and 33.334 compare equal at
  exactly the pixel scale this work exists to fix.
- `ZoneProperties.tsx`'s `step={0.1}` and `roundPercent` move to three decimals in the same change.
- The Layout editor gains a `reference_resolution` field, seam guides drawn at cumulative monitor
  width ÷ total width (**not** at rounded percentages), and an even-split-into-N-columns action that
  hands out the remainder deliberately.
- One preview component with three mount points (Playlist editor, Composition editor, wizard step 5,
  where `PreviewPanel.tsx`'s dead button already sits). Every Zone's state is a pure function of one
  shared `t` — `t mod` that Zone's loop length gives its item index and offset — so the scrubber is
  setting `t` and speed is how fast `t` advances. A timer per Zone makes the scrubber a rewrite
  instead of an addition. A Playlist is the one-Zone case at `x=0 y=0 w=100 h=100`, not a second code
  path. Loop length uses `COALESCE(item, asset)` as activation does; a Zone that resolves to nothing
  has length zero, is held on its placeholder and never enters the `t mod` arithmetic.
- No new dependency anywhere in this spec.

### Player (`Ads_Manager_WindowApp` — separate repo, not modified from this branch)

`AppConfig` gains `SpanAllDisplays: bool = false`; when true the window is positioned across the
virtual desktop instead of maximized, and `GetPhysicalBounds` then reports the spanned size with no
further change. Default off: production holds 504 devices that have never reported a screen size and
four that have, every one a single-monitor install, and a technician attaching a maintenance monitor
to any of them would otherwise stretch the running signage across both.

## Testing Decisions

A good test here asserts what an operator or a Media Device would observe — "an incomplete
Composition cannot be activated", "a Publication with no Composition still returns `slots[]`" — never
which function computed it. Existing seams are extended in preference to new ones.

**Frontend — `*.check.mts`, `node:assert`, run with `node <file>.check.mts`. No test runner is
added.** Prior art: `layouts/geometry.check.mts`, `publications/publish-eligibility.check.mts`,
`playlists/content-compatibility.check.mts`.

- The Composition rules module gets one check file: unbound-Zone detection, per-Zone duration totals,
  completeness against a Layout whose Zone set changed, and the draft → payload mapping.
- `geometry.check.mts` moves to thousandths — note it currently asserts
  `roundPercent(33.34) === 33.3` and will break loudly, which is the good case — and gains the
  `parseAspectRatio` error cases and the even-split remainder.
- `publish-eligibility.check.mts` gains the `composition` branch and the equal-priority overlap
  block. No capability block — ADR 0054 defers it, so `publish-eligibility.ts` grows no capability
  row and its positional check array is otherwise unchanged.
- `step-validation` gains the composition-type step-2 completeness case.
- The preview's clock gets one check: item index and offset for a given `t` across two Zones of
  different lengths, including a zero-length Zone.
- Nothing new is written for the wireframe, the pickers or the store — rendering and persistence are
  not where the logic lives.

**Backend — no unit runner exists in `Thunder_Core`, and none is introduced.** After apply: dump
`pg_get_functiondef` and diff against the migration file, assert exactly one overload per function,
assert grants (`service_role` + `postgres` only, no `anon` / `authenticated` / `PUBLIC`) with
`has_function_privilege`, and re-run the advisors. Behaviour is then probed with SQL against a scratch
tenant. The production Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b` is not touched.

**HTTP / UI.** `tsc`, `lint` and the check files prove compilation and logic, never behaviour. Each
ticket names the layers it verified and the layers it did not. The standing trap: the frontend calls
the **deployed** `Thunder_Core` (`CORE_API_URL` → `thundercore.vercel.app`, confirmable at
`/api/proxy/__config`), so a route change is invisible through the UI until it is deployed, while a
migration applied over MCP is live immediately.

## Out of Scope

- **The player's multi-Zone renderer (audit B1).** It does not exist, it is required by ADR 0044 and
  0049 whatever the monitor count, and it is the real gate on a screen actually showing a composition.
  Everything in this spec is buildable and verifiable server-side without it.
- True video walls — several machines driving one image in step (audit B7). One machine spanning
  several monitors is in scope; synchronising separate machines is not.
- An explicit monitor grid and snap-to-seam. Guides plus the even-split action address the failure
  that matters; a grid is a larger decision than this customer needs.
- Device screen capture and rehearsal-on-a-real-screen (ADR 0051 §7), and the storyboard table.
- The free-form drag-resize canvas, user-saved templates, widget Zones, styled or animated tickers,
  and `compositions[]` in one poll response — all deferred by ADR 0044.
- The two `playback_logs` defects noted in ADR 0044 (under-reported `duration_played_seconds`, missing
  entries). Zones multiply both, so they must close before Zone-aware proof of play is trusted — but
  they are their own fix.
- The pre-existing `ERR_UNSUPPORTED_DIR_IMPORT` failure in the playlists list-url-state check (a bare
  `../types` directory import). One-line fix, unrelated, awaiting its own instruction.
- Layout as a property of a Channel, content directly on `layouts`, and renaming Layout to
  "Layout Template" — rejected in ADR 0044 §1 and ADR 0049 respectively, not revisited here.

## Further Notes

- Sequencing that actually matters: Zone-id stability and geometry precision come **first**, because
  every Composition binding depends on a Zone id that survives a Layout save and the snapshot's
  geometry type caps the whole feature. Then the Composition entity, then its editor, then the
  Publication type, then activation, then the equal-priority overlap block, and the `zones[]` payload
  last of those. It no longer waits on a capability gate — ADR 0054 defers that — so the order is
  **05 → (09, 16) → 10**, where 16 is the Layout ↔ target geometry fit rule, itself preceded by
  ticket 07's production apply as a schema prerequisite.
- **Known limitation — concurrent video capacity is not checked anywhere.** `max_video_zones` per
  platform is unmeasured, no player build reports it, and ADR 0054 defers enforcement rather than
  gating on a number nobody has taken. A Composition may therefore be published to a Device that
  cannot decode all of its video Zones at once; playback may stutter, drop video, or fail on that
  Device. This is a knowingly accepted rollout risk, not an oversight.
- Nobody has measured what a real three-monitor machine reports for `screen_width`. ADR 0050 §5
  predicts 1920 until the window is made to span.
- `apply_migration` assigns its own timestamp, so local migration filenames will not match production
  migration history. That drift is expected and is not repaired.
- `AUDIT_Player_Gaps_Priority.md` in the player repo is wrong about A6: `App.xaml.cs:112` already
  subscribes to `SystemEvents.DisplaySettingsChanged`. Correcting it is a one-line documentation fix
  in a repo this branch does not touch.
