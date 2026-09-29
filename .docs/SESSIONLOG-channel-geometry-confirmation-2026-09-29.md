# Single-screen Channel geometry confirmation — 2026-09-29

Decision: ADR 0079. Continues a Codex handoff; code was already in the working tree, uncommitted.

## Done
- Frontend: mismatch warning + explicit checkbox on Create Channel Review and Channel editor; `confirm_mismatch` sent only when checked (`create-wizard-state.ts`, `GeometryMismatchWarning.tsx`, `CreateChannelModal.tsx`, `Step3Review.tsx`, `ChannelEditorPage.tsx`, `channel-write-api.ts`).
- Core migration `20260929072102_channel_single_screen_geometry_confirmation.sql` (Thunder_Core, untracked): orientation mismatch now gated on `p_confirm_mismatch` like resolution.
- Applied to `develop` DB (`ftfmokgphewzyxzwjitv`), tested, then to prod (`sfiefevtxalqjizdkcsw`) on the user's instruction. Prod's pre-apply `prosrc` md5 matched develop's (`85e86c…`); post-apply both are `1870a4…`, one overload, ACL `postgres`/`service_role`. Prod was not exercised beyond that check.

## Verification
- Static: `create-wizard-state.check.mts` and `tsc --noEmit` pass.
- SQL (develop, read-only calls of `media_core.channel_validate`, Player "ThunderOne Screen 01" landscape 1920x1080):
  portrait without confirm → rejected; portrait with confirm → ok; landscape match → ok; foreign tenant with confirm → still `not found`.
  One overload only; ACL unchanged (`postgres`, `service_role`).
- Browser (localhost:3000 → local Core :3001 on `develop` branch → develop DB), wizard only, **Create Channel never clicked**:
  Screen 02 + 1080x1920 → warning shown, Create disabled; checkbox ticked → Create enabled.
  Screen 02 + 1920x1080 → no warning, Create enabled. Wizard cancelled, nothing saved.

- HTTP (develop, user-approved write): wizard with portrait 1080x1920 on landscape Screen 02, checkbox ticked → `POST /api/proxy/media/channels` 200, row persisted with `expected_orientation=portrait`, `expected_resolution=1080x1920`.
  Test row `zz-geo-verify` (`ef631ae4-91e0-4599-9883-a19683121b73`, develop DB) is **still there**: `DELETE` returns 409 because a Channel is created active and only never-activated drafts are deletable. Cleanup needs a decision (deactivate vs raw SQL delete).

## Also fixed: hydration mismatch on `/channels?create=1`
- Root cause: `ChannelsListPage` initialised `isCreateOpen` from `typeof window` / `window.location` → false on the server, true on the client, so the client rendered an extra `<dialog>`. Now reads `useSearchParams()`.
- Verified: server HTML for `?create=1` now contains the dialog; fresh tab shows no console error and the dialog opens. (Console capture may start after hydration; the SSR HTML check is the firmer evidence.)

## Not verified
- Update (PATCH) of an existing Channel with `confirm_mismatch`, and the editor page warning, in the browser.
- Channel editor page warning in the browser.
- Unknown (NULL) Player geometry in the browser (covered by the `.check.mts` only).

## Remaining
- Clean up test row `zz-geo-verify` on develop (needs a deactivate-vs-SQL-delete decision).
- Deploy Core so the live API uses the new validator; FE PR depends on it.
- Core migration is on branch `feat/channel-geometry-confirmation` (PR to `develop`); FE on `feat/channel-geometry-confirmation` (PR to `dev`). Unrelated preview/publication working-tree files were left out.
