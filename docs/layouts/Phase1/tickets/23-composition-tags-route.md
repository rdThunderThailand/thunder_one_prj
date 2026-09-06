# 23 — API route for `media_composition_set_tags`

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/53
**Repo:** `Thunder_Core` · same branch as 22
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` BE-3
**Blocked by:** 22
**Blocks:** the Tags half of 25 and 29
**Status:** in progress — route + client written on `feat/layoutV2`, both repos. HTTP verification
pending backend deploy to `develop`.

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

- [ ] Call the deployed `develop` route with a real session, set two tags, read them back through
      the library list endpoint — not through the RPC directly (`CLAUDE.md` §3: verify at the layer
      the user uses). **Blocked on deploy.**
- [ ] A request naming another tenant's Composition is refused. **Blocked on deploy.**

Note: the underlying RPC `media_composition_set_tags` is already applied to `develop` and fully
verified under #52 (dedupe/trim, cross-tenant refusal, shared-vocabulary reuse). This route is a
pure pass-through, so the remaining checks are HTTP-transport only.
