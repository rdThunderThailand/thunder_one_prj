# 02 — Composition entity: schema and RPCs

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §1, §3, §4, §6, §8, §10, §13

**What to build:** the server side of a Composition — a named, reusable pairing of one Layout with
content per Zone. Create it, bind Zones, activate it, and have the rest of the system refuse to pull
the rug out from under it. No UI yet (that is ticket 03) and no Publication can point at one yet (that
is ticket 04).

**Blocked by:** 01 — Layout Zone identity is stable, geometry gains precision

**Status:** backend shipped — migration applied to **production** as
`20260826095037 composition_schema_and_rpcs` (`20260826092456` on `develop`). Verified at the SQL
layer only.

**Same two caveats as ticket 01, checked 2026-08-26:** the migration file and the whole
`src/app/api/core/v1/media/compositions/` route directory are **untracked in `Thunder_Core` git**, so
the RPCs exist on production while the routes that call them are not committed and therefore not
deployed — `Thunder_Core` deploys from `develop`. Any browser test of a Composition hits a 404 until
that lands.

**Every apply to production is R0 and needs approval. Rehearse on `develop` first.**

- [ ] `media_core.compositions` exists: `id, tenant_id, name, layout_id, status, revision, metadata,
      created_at, updated_at`, `UNIQUE (tenant_id, name)`, status CHECK `draft | active | inactive`
      copying `playlists_status_check`
- [ ] `media_core.composition_zones` exists: `layout_zone_id NOT NULL REFERENCES layout_zones ON DELETE
      RESTRICT`, `playlist_id NOT NULL REFERENCES playlists ON DELETE RESTRICT`, `playback jsonb` under
      the same CHECK as `publication_snapshot_zones.playback`,
      `UNIQUE (composition_id, layout_zone_id)`. **No `position` column** — Zone order is
      `layout_zones.position`, read by join
- [ ] `media_composition_upsert` creates and updates, with `revision` as an optimistic lock, and filters
      tenant inside the function
- [ ] Changing `layout_id` deletes every binding of that Composition in the same transaction, and is
      refused outright while the Composition is `active`
- [ ] `media_composition_set_zones` replaces the whole binding set in one transaction; rejects a Zone
      that does not belong to the Composition's Layout and a Playlist from another tenant
- [ ] It does **not** require completeness — a `draft` may be saved half-bound — but refuses to leave
      an `active` Composition incomplete
- [ ] `media_composition_set_status`: `draft → active` requires a binding for every Zone of the Layout,
      checked in the same transaction; `active ↔ inactive` is free; there is no delete
- [ ] Deleting a `layout_zones` row that any Composition binds is refused, and the error names the
      Compositions holding it, in the `Invalid input: …` form the route's error passthrough matches
- [ ] `media_playlist_upsert` gains an inline create path yielding `kind = 'inline'`,
      `status = 'active'`, named after its Composition and Zone. It forces `kind = 'user'` on create
      today, which would surface every Zone's implicit Playlist in the operator's own Playlist list
- [ ] Editing a Zone's assets **updates that Zone's existing inline Playlist** rather than minting
      another one; re-pointing the Zone at a saved Playlist sets the inline one `inactive`
      (`media_playlist_delete` refuses every `kind <> 'user'`, so it can never be removed)
- [ ] `media_playlist_delete` gains a count over `composition_zones`, raising
      `'Invalid input: playlist is used by % composition(s)'` — without it a bound saved Playlist
      passes the existing `publications.playlist_id` guard and returns a raw FK violation as a 500
- [ ] Routes: `GET|POST /media/compositions`, `GET|PUT /media/compositions/:id`,
      `PUT /media/compositions/:id/zones`, `PUT /media/compositions/:id/status`. Zod validates shape
      only; membership and tenancy stay in the RPC
- [ ] The read path returns the Composition with its Zones joined to `layout_zones` (geometry, name,
      position) so a client can render it without a second call
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload of each touched function, grants confirmed with `has_function_privilege` (`REVOKE` from
      `PUBLIC` explicitly), advisors show no new finding
- [ ] Scratch-tenant SQL probe: create a Composition on a 2-Zone Layout, save it half-bound, fail to
      activate, bind the second Zone, activate, fail to unbind, fail to change its Layout, fail to
      delete a bound Zone, fail to delete a bound Playlist, set it `inactive`
