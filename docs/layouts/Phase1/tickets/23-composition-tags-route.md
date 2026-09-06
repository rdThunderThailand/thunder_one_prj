# 23 — API route for `media_composition_set_tags`

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/53
**Repo:** `Thunder_Core` · same branch as 22
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` BE-3
**Blocked by:** 22
**Blocks:** the Tags half of 25 and 29
**Status:** verified — tested 2026-09-06 via localhost dev servers (One :3000 → Core :3001 → develop
DB). All three checks passed; not yet deployed to `develop`.

## What to build

One pass-through route. 21 needs no route — `media_layouts_list` already has one.

## Checklist

- [x] `Thunder_Core` `src/app/api/core/v1/media/compositions/[id]/tags/route.ts` — copied the shape of
      `media/playlists/[id]/tags/route.ts` (the layouts `kind` route is the same pattern; the playlist
      tags route is the exact analogue). `PUT`, `apiHandler`, `requireMediaTenant`, `callMedia`.
- [x] Zod schema for the body: `z.object({ tags: z.array(z.string()).max(50) })`
- [x] **Tenant comes from the session** (`requireMediaTenant(request)`), never from the body
- [x] Raw DB errors are not forwarded — `apiHandler` wraps; parse failure throws a generic message
- [x] Frontend `compositions-api.ts` gains `setCompositionTags(id, tags): Promise<Tag[]>` — mirrors
      `setPlaylistTags`; returns the RPC's canonical stored set, not the typed strings

## Verification

- [x] `PUT /api/proxy/media/compositions/<id>/tags` with `{tags:["ข่าว","  ข่าว  ","Promo"]}` on
      composition `af896984-…` (session `piyapat@thunder.co.th`) → `200`, response `data.tags` = 2
      entries (`Promo`, `ข่าว`) — trim + case-insensitive dedupe worked, not 3.
- [x] `GET /api/proxy/media/compositions?page=1&page_size=50` → that row carries
      `tags: [{Promo},{ข่าว}]` with the DB's canonical casing. Verified at the list layer, not the RPC.
- [x] `PUT .../00000000-0000-0000-0000-000000000000/tags` → `404 {"error":"not found: active
      composition not found for this tenant"}` — refused, no raw SQL / stack trace leaked.
- Cleanup: tags reset to `[]` after the test.

Tested on localhost dev servers (not deployed to `develop`). The underlying RPC was already fully
verified under #52; this run covers the HTTP transport + proxy + list serialization.
