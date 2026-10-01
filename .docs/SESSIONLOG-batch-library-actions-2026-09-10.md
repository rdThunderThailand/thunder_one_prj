# Batch Library Actions — 2026-09-10

## Implemented

- Added native checkbox selection to Media, Playlist, and Layout list tables, including select-all for the current page.
- Added selected-row soft delete outside Trash.
- Added selected-row recovery and permanent deletion inside Trash.
- Added `Recover All` and `Delete All` to all three Trash views.
- Reused the existing per-item APIs; Layout loads every Trash page before an all-items action.
- Kept confirmation before every batch mutation and reports partial failures.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- Targeted ESLint for the six changed list/table files — passed.
- Browser verification awaits the user's required choice. Permanent-delete confirmation must not be accepted without action-time approval.

## Not performed

- No production write, permanent deletion, commit, push, or deploy.
