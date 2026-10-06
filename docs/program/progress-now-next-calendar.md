# Progress — Now & Next refresh + Calendar

Read this first when resuming. Plan: [`plan-now-next-calendar.md`](plan-now-next-calendar.md) · ADRs 0084 / 0085 · handoff: `/tmp/thunder-handoff-now-next-calendar/HANDOFF.md`.
Last updated: 2026-10-06.

## Where we are

**S1 in progress. FE-R committed + browser-verified (except End / publish-success). FE-A1 code done (not mounted anywhere yet, so not browser-verified). BE-A applied to develop and HTTP-verified (not pushed, no Core PR yet). Next: FE-A2 (Now & Next redraw) can start against it.**

FE branch `feat/now-next-s1-fe` (off `dev`). Core not touched yet (checkout is on someone else's `codex/core-142-mutation-guards` with uncommitted edits — use a worktree off `origin/develop`).

## Tickets

| Ticket | Status | Notes |
|---|---|---|
| BE-A Core: `p_group_id`, row Channel fields, publication `content` | **applied to develop, verified** | Worktree `/Users/arty/Desktop/Thunder/project/Thunder_Core-now-next`, branch `feat/now-next-group-scope` (local commit, not pushed). `prosrc` md5 matches the file; one overload; ACL `postgres` + `service_role` only. HTTP (worktree Core :3012 → develop DB, via FE proxy): group scope returns exactly the members (idle rows with `include_idle`, none without), both params → 400, unknown Group → 404, bad uuid → 400, `content {kind,id,name}` + Channel fields present. **Not done**: prod migration (R0), push + Draft Core PR, `now-next/route` check for upcoming `content` rows (only current sampled) |
| FE-R `returnTo` in Program editor | **done** | `return-to.ts` + check; `ProgramEditMenu.tsx` extracted (302 → 268 lines). Browser (develop data): Go Back → returnTo ✓, dirty Discard → returnTo ✓, `//evil`/none/`/overview` → Programs list ✓. **Not exercised**: End program and Publish-changes success (they write to develop) |
| FE-A1 popover dependency + scope picker | **code done** | `@radix-ui/react-popover` 1.2.0, `lovable/popover.tsx` (from Lovable project e8b49026…), `channel-scope.ts` + check, `ChannelScopePicker.tsx`; tsc + eslint clean. Picker is verified only once FE-A2 mounts it. Draft Channels are hidden from the list; "All" count = active Channels |
| FE-A2 Now & Next redraw | blocked | needs BE-A deployed, FE-A1, FE-R |
| FE-A3 Channel deep link | blocked | same PR as FE-A2 |
| BE-B / FE-B1 / FE-B2 (S2 Calendar) | blocked | after S1 |

## Open questions for the user

1. Confirm deleting the demo data (ADR 0084 §10) — only needed at FE-A2.
2. Optional: Figma frame link.
3. At PR time: Thai or English.

## Log

- 2026-10-06 — Created branch, FE-R implemented: `safeReturnTo` (same-origin `/media-workspace/…` only), Go Back / Discard / End / successful publish honour `returnTo`; Delete keeps Programs list.
- 2026-10-06 — Docs committed on `feat/now-next-s1-fe`. FE-R verified in browser. Popover primitive + channel-scope added.
- 2026-10-06 — FE-A1 ChannelScopePicker written (loads channels + groups when opened, or on mount if the URL already has a scope; applies on Apply only).
- 2026-10-06 — FE-A1 committed (d28b1ff). BE-A: Core worktree created, migration + rollback + route written; tsc shows no errors in now-next files.
- 2026-10-06 — BE-A migration applied to develop; verified over HTTP. **Temporary local setup**: FE `.env.local` `CORE_API_URL` → `http://localhost:3012` (backup `/tmp/env.local.bak`, original `:3001`); Core worktree runs `next dev --webpack -p 3012` (its `node_modules` is a symlink to `../Thunder_Core/node_modules`, Turbopack rejects that). Restore before finishing.
