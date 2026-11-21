# 0123 — Success is a toast, failure stays inline, decisions are dialogs

Status: accepted (2026-11-20, owner decision in the grilling session of ADR 0122).
**Workspace:** all (repo process)

## Context

`sonner` is installed and `<Toaster position="top-right" richColors />` is mounted once in
`src/app/layout.tsx`. On 2026-11-20 `src/` has 36 `toast.error` and 14 `toast.success` calls; other
features render a `role="status"` paragraph, and some say nothing: saving a Channel just navigates back
to the list. `richColors` paints with sonner's own palette, not the design-system tokens, and the
`thunderone-ui` skill defines no toast. Most existing `toast.error` calls do not follow rule 2 below.

## Decision

1. **A completed action the user started reports success with a toast** — saved, deleted, activated,
   deactivated, copied. The Toaster lives in the root layout, so the toast survives the navigation that
   often follows. When there is a follow-up, the toast carries one action (for example `View drafts`).
2. **A failure stays inline where the action lives** — the card, form or field — because a toast
   disappears before the operator has read and fixed it. A toast error is only for an action with no
   place to show it (a background or row-level action whose row is gone).
3. **A dialog is for a decision or for something to read** — confirming a destructive action, or a
   partial result with a list. Never a dialog that only says "done".
4. **The Toaster is styled once with tokens** (`toastOptions.classNames` using `success`, `error`,
   `muted`, …) in `layout.tsx`; `richColors` goes. No wrapper component. This restyles every existing
   toast at once, on purpose: it is colour only, and it removes the one raw palette in the shell.
5. **Behaviour adoption is incremental.** Channel flows follow rules 1–3 with ADR 0122; any other screen,
   including the existing `toast.error` calls, moves when work touches it. No app-wide sweep.

## Considered options

- **A success dialog.** Rejected: an extra click that carries no decision.
- **Inline success banners everywhere.** Rejected: lost on the navigation that follows most saves.
