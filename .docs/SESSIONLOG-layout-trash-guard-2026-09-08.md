# SESSIONLOG — Layout Trash guard: apply to Develop + clickable Programs

Date: 2026-09-08
Branches: `feat/layoutV3` (thunder_one_prj and Thunder_Core)
Design: `docs/adr/0066-layout-trash-is-blocked-by-live-programs.md`

## What happened

Continued the handoff at `/private/tmp/thunder-layout-trash-develop-supabase-handoff-2026-09-08.md`.
The implementation was already in both worktrees; the migration had never been applied.

### 1. Migration applied to Develop Supabase

Target resolved at action time, not from a filename: `list_branches` on ThunderCore
(`sfiefevtxalqjizdkcsw`) shows branch `develop` = project `ftfmokgphewzyxzwjitv`, which matches
`NEXT_PUBLIC_SUPABASE_URL` in `Thunder_Core/.env`.

Pre-checks:

- Only one migration pending. Latest on the DB was `20260908044654 zone_media_fit_and_mute`.
- `media_composition_trash(uuid,uuid)` already existed with the *same* signature and `jsonb` return,
  so `CREATE OR REPLACE` replaces rather than creating an overload.
- `media_core.publication_effective_status` has 4 parameters with `p_at timestamptz DEFAULT now()`,
  so the migration's 3-argument calls resolve.

Applied `20260908160000_block_trashing_used_compositions.sql` via Supabase MCP `apply_migration`.

### 2. SQL-level verification

- `prosrc` md5 of all three installed functions matches the bodies extracted from the migration file
  (`media_publication_guard_composition_trash` `9235c57…`, `media_composition_programs_list`
  `4a5785d…`, `media_composition_trash` `ceb2d9e…`).
- All three are `SECURITY DEFINER` with `search_path=""`.
- Grants are `postgres:EXECUTE` and `service_role:EXECUTE` only — no PUBLIC/anon/authenticated leak.
- Trigger installed: `media_publications_guard_composition_trash BEFORE INSERT OR UPDATE OF
  composition_id ON media_core.publications FOR EACH ROW`.
- Read-only behavior check: `media_composition_programs_list` returns the two draft Programs blocking
  `Browser Verify Ticket 04 Composition 2026-08-26`. No fixtures were mutated.

### 3. Clickable Programs in the blocked-Trash dialog

`src/features/media-workspace/compositions/components/CompositionLibraryDialogs.tsx` — the Program
name in the "Programs using this layout" table is now a link, following the same routing rule as
`PublicationsListPage`:

- `draft` → `/media-workspace/publications/create?id=<id>` (edit wizard)
- otherwise → `/media-workspace/publications/<id>` (detail)

`onClick={onClose}` closes the dialog on navigation.

Gates: `pnpm exec tsc --noEmit` clean, ESLint on the changed file clean.

### 4. Browser verification — PASS

The user ran the 6-step checklist and reported all steps passing, including the draft link landing on
the edit wizard and the in-use Layout never reaching Trash.

### 5. Committed and folded into the existing PRs

Both repositories were already on `feat/layoutV3` with an open Draft PR, so pushing folded the work
into them rather than opening new ones. Each PR body gained a Thai section covering ADR 0066.

- thunder_one_prj `cb9343d` → PR #61 (Draft, into `dev`)
- Thunder_Core `b88f209` → PR #52 (into `develop`)

Deliberately left unstaged: the unrelated ADR 0065 / request-count work still dirty in the frontend
tree (canvas pane, editor header, folder rails, list page, table, zone pickers, preview components,
`docs/adr/0065-*`, `docs/media-library/plan-request-count.md`). The one exception is `Modal.tsx`,
which carries both this work's `hideTitle` and that work's `preview` size in the same file and could
not be split; the extra size key is inert on its own.

### 6. Production apply

The user merged Thunder_Core #52 into `develop` (`8634a8d`), which deploys Core, then authorized the
production apply. The same migration was applied to production (`sfiefevtxalqjizdkcsw`).

Pre-checks matched Develop exactly: same `media_composition_trash(uuid,uuid)` signature and return
type, and `publication_effective_status` carrying its 4th defaulted parameter.

Verification on production: `prosrc` md5 of all three functions matches the file *and* matches what
was installed on Develop; `SECURITY DEFINER` + `search_path=""` on all three; grants limited to
`postgres` and `service_role`; trigger attached to `media_core.publications` with the expected
timing. No row was read for mutation and no data was changed.

## Known gap after this session

**Frontend PR #61 is still a Draft and is not merged**, so the production frontend still reads the
old `{ draft, scheduled, active }` trash response while the production database now returns
`{ trashed, programs }`. The database blocks the trash correctly — no data is lost and no in-use
Layout disappears — but the old UI may report success for a trash that did not happen until the user
reloads. Merging #61 and deploying the frontend closes this.

## Not done

- Frontend #61 not merged, not marked ready (Claude does not flip PRs out of Draft).
- No HTTP-level test of `GET /media/compositions/[id]/programs`; the dialog was exercised through the
  DELETE trash response only.
- Layouts already sitting in Trash while referenced are not rewritten by this migration.
