# Media Library implementation plan

Build the Media Library as the first UI client of ADR-0056, using real tenant Assets and the existing Thunder One shell. Unsupported Audio, Documents and Tags surfaces remain visibly disabled rather than mocked.

## Phase 1 — backend contract

- Add the scoped nested Folder model, nullable `folder_id` columns for Assets, Playlists and Compositions, and `deleted_at` lifecycle fields.
- Add tenant-checked Folder create/list/rename/move/delete operations with sibling-name, depth, cycle and empty-delete guards.
- Extend Asset list and registration contracts for server search/filter/sort/pagination, subtree selection, Trash views and atomic Folder placement.
- Add the scoped folder columns and Asset soft-delete, restore and dependency-checked permanent-delete operation. Playlist/Composition lifecycle RPCs remain follow-up work.
- Leave Templates, Tags, Audio, Documents, bulk deletion, auto-purge and drag-and-drop out.

## Phase 2 — Media Library UI

- Replace the `/media-workspace/assets` placeholder while reusing the existing dashboard shell, UI primitives, preview URL loader and upload pipeline.
- Implement real summary counts, URL-backed filters, grid/list views, pagination and loading/error/empty states.
- Implement the nested Folder sidebar and accessible create/rename/move/delete flows, moving Assets, Trash, restore and permanent delete. Playlist/Composition UI adoption remains a separate follow-up per ADR-0056.
- Render unsupported design controls as disabled with a concise explanation.

## Verification

- Add one focused `node:assert` check for Folder tree/list-state logic and contract mapping.
- Run the focused check, Next type generation, TypeScript, targeted lint and `git diff --check`.
- Browser verification was run on authenticated local develop-backed services after explicit user approval. Any production-writing upload/delete path still requires a fresh target/tenant preflight and explicit approval before the click.
