# 23 — API route for `media_composition_set_tags`

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/53
**Repo:** `Thunder_Core` · same branch as 22
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` BE-3
**Blocked by:** 22
**Blocks:** the Tags half of 25 and 29
**Status:** not started

## What to build

One pass-through route. 21 needs no route — `media_layouts_list` already has one.

## Checklist

- [ ] `src/app/api/core/v1/media/compositions/[id]/tags/route.ts`, following the shape of
      `media/layouts/[id]/kind/route.ts`
- [ ] Zod schema for the body: `{ tags: string[] }`
- [ ] **Tenant comes from the session, never from the body**
- [ ] Raw DB errors are not forwarded to the client
- [ ] Frontend `compositions-api.ts` gains `setCompositionTags(id, tags)`

## Verification

- [ ] Call the deployed `develop` route with a real session, set two tags, read them back through
      the library list endpoint — not through the RPC directly (`CLAUDE.md` §3: verify at the layer
      the user uses)
- [ ] A request naming another tenant's Composition is refused
