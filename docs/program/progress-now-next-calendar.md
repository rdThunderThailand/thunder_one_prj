# Progress — Now & Next refresh + Calendar

Read this first when resuming. Plan: [`plan-now-next-calendar.md`](plan-now-next-calendar.md) · ADRs 0084 / 0085 · handoff: `/tmp/thunder-handoff-now-next-calendar/HANDOFF.md`.
Last updated: 2026-10-06.

## Where we are

**S1 started. FE-R code done (not committed, not browser-verified). Next: FE-A1, BE-A.**

FE branch `feat/now-next-s1-fe` (off `dev`). Core not touched yet (checkout is on someone else's `codex/core-142-mutation-guards` with uncommitted edits — use a worktree off `origin/develop`).

## Tickets

| Ticket | Status | Notes |
|---|---|---|
| BE-A Core: `p_group_id`, row Channel fields, publication `content` | not started | needs Core worktree; migration apply = R0 |
| FE-R `returnTo` in Program editor | **code done** | `return-to.ts` + check pass; `ProgramEditMenu.tsx` extracted (page 302 → 268 lines); `tsc` + eslint clean. Browser check pending (ask user) |
| FE-A1 popover dependency + scope picker | not started | `@radix-ui/react-popover` approved in ADR 0084; Lovable `popover.tsx` existence unconfirmed |
| FE-A2 Now & Next redraw | blocked | needs BE-A deployed, FE-A1, FE-R |
| FE-A3 Channel deep link | blocked | same PR as FE-A2 |
| BE-B / FE-B1 / FE-B2 (S2 Calendar) | blocked | after S1 |

## Open questions for the user

1. Commit the 4 doc files (CONTEXT.md, ADR 0084, ADR 0085, plan) — and this file — on which branch? Nothing is committed yet.
2. Confirm deleting the demo data (ADR 0084 §10) — only needed at FE-A2.
3. Optional: Figma frame link; confirm Lovable has `popover.tsx`.
4. At PR time: Thai or English.

## Log

- 2026-10-06 — Created branch, FE-R implemented: `safeReturnTo` (same-origin `/media-workspace/…` only), Go Back / Discard / End / successful publish honour `returnTo`; Delete keeps Programs list.
