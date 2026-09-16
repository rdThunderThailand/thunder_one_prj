# Batch Library Actions

## Scope

- Add row selection to Media, Playlist, and Layout list tables.
- Outside Trash, move selected rows to Trash through the existing per-item APIs.
- In Trash, restore or permanently delete selected rows.
- Add `Recover All` and `Delete All` actions to each Trash view.

## Constraints

- Reuse existing per-item endpoints; no backend or dependency changes.
- Keep permanent-delete confirmation and report partial failures or blocked rows.
- Selection is page-local and clears when the visible collection changes.

## Verification

- Run the narrow TypeScript and lint checks for changed files.
- Browser-check selection, soft-delete, restore, and confirmation surfaces; do not confirm permanent deletion without action-time approval.
