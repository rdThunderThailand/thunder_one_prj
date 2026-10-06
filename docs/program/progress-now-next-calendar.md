# Progress — Now & Next refresh + Calendar

Read this first when resuming. Plan: [`plan-now-next-calendar.md`](plan-now-next-calendar.md) · ADRs 0084 / 0085 · handoff: `/tmp/thunder-handoff-now-next-calendar/HANDOFF.md`.
Last updated: 2026-10-06.

## Where we are

**S1 in progress. FE-R committed + browser-verified (except End / publish-success). FE-A1 half done (popover + channel-scope). Next: ChannelScopePicker, BE-A.**

FE branch `feat/now-next-s1-fe` (off `dev`). Core not touched yet (checkout is on someone else's `codex/core-142-mutation-guards` with uncommitted edits — use a worktree off `origin/develop`).

## Tickets

| Ticket | Status | Notes |
|---|---|---|
| BE-A Core: `p_group_id`, row Channel fields, publication `content` | not started | needs Core worktree; migration apply = R0 |
| FE-R `returnTo` in Program editor | **done** | `return-to.ts` + check; `ProgramEditMenu.tsx` extracted (302 → 268 lines). Browser (develop data): Go Back → returnTo ✓, dirty Discard → returnTo ✓, `//evil`/none/`/overview` → Programs list ✓. **Not exercised**: End program and Publish-changes success (they write to develop) |
| FE-A1 popover dependency + scope picker | in progress | done: `@radix-ui/react-popover` 1.2.0, `lovable/popover.tsx` (copied from Lovable project e8b49026…), `channels/channel-scope.ts` + check. Left: `ChannelScopePicker.tsx` |
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
