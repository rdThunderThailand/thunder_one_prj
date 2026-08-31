# 03 — Composition list page and editor

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §1, §3, §4, §6, §8, §10

**What to build:** an operator authors a split-screen composition as a named thing they can find
again. Pick a Layout, click a Zone in the wireframe, bind a Playlist or a set of assets to it with its
own playback settings, Zone by Zone, save half-done and come back tomorrow, activate when it is
complete.

**Blocked by:** 02 — Composition entity: schema and RPCs

**Status:** done — commit `99c859f`

**Its pages are superseded before they were ever reachable.** ADR 0052 merges this editor with the
Layout editor onto one page and moves its routes; ticket 15 carries that out. The mechanisms this
ticket built — the implicit-Playlist resolution, the clear-bindings confirmation, the wireframe Zone
selector, `zone-bindings.ts` — all survive and move. Nothing here was ever added to the sidebar, so no
operator has used it.

**Known gap, carries into ticket 15 — found in the ticket 04 browser pass, 2026-08-26.** The
"activation refused, unbound Zones named" requirement above is not met as shipped: activating with an
unbound Zone just disables the button, with no message naming which Zone. Ticket 15 line 64 already
requires the Zone names in the message, so this is not a new acceptance item to add there — it is a
flag that the requirement is not free just because the page moves as-is.

### Acceptance as specified — historical

Shipped in `99c859f` (23 files: the three routes, `CompositionsListPage` / `CompositionEditorPage` /
`ZoneContentPicker` and the list-filtering, list-url-state and `zone-bindings` modules with their
check files). **The boxes below are left unticked on purpose.** The code landed and its check files
passed, but the pages were never reachable from the sidebar and were **never verified in the browser**
— the last item never happened, and ticking the rest would imply it did. Ticket 15 replaces these
pages, so this list is a record of what was built, not a gate anyone still has to pass.

- [ ] Routes at `src/app/(dashboard)/(application)/media-workspace/compositions` — `page.tsx`,
      `create/page.tsx`, `[compositionId]/page.tsx` — mirroring `playlists` and `layouts`. The empty
      `communication/layouts` directories are leftovers from the route migration, not the pattern
- [ ] Feature code at `src/features/media-workspace/compositions`, mirroring `layouts`: list
      filtering, list url state and status display in the same shapes with the same check files
- [ ] The list page shows name, Layout, status and Zone-bound count, with the same filter and
      url-state behaviour the Layouts list already has (including Back/Forward on filters)
- [ ] The Layout picker offers active Layouts only — archived ones are absent
- [ ] The picked Layout renders as a wireframe with its Zones named, reusing `LayoutWireframe`; no
      second wireframe component is written
- [ ] Selecting a Zone in the wireframe scopes the content picker to that Zone
- [ ] A Zone accepts either an existing Playlist or a set of picked assets with per-asset duration and
      transition, matching what the Publication wizard already offers for full screen; picked assets
      become that Zone's inline Playlist via the ticket-02 path
- [ ] A Zone accepts its own play mode / repeat / start-from, which override the bound Playlist's
- [ ] Each Zone shows its own total duration
- [ ] Unbound Zones are called out; saving a `draft` with unbound Zones succeeds, activating does not,
      and the refusal names the unbound Zones
- [ ] Changing the Layout asks for confirmation stating that every binding is cleared, then clears them
- [ ] An `active` Composition refuses the changes that would make it incomplete, with the server's
      message shown — no raw error text reaches the operator
- [ ] Content compatibility (asset type, approval) applies per Zone the same way it applies to a flat
      Publication
- [ ] Composition rules live in one pure module — unbound-Zone detection, per-Zone duration totals,
      completeness against the Layout, draft → payload mapping — with one `*.check.mts` covering all
      four. **`zone-bindings.ts` from the superseded model is rewritten here, and
      `hasLayoutZoneDrift` is deleted rather than moved** (drift is ticket 06, by revision, not a
      client-side set difference over Zone ids)
- [ ] `tsc` and `lint` clean on changed files; the check file runs with `node <file>.check.mts`
- [ ] Verified in the browser, not only by `tsc` / `lint` / check files
