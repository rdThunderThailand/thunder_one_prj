# Plan — Publish Changes + default Program name

Status: planned (2026-09-29). Decisions: ADR 0078 (grilled, owner-approved, then fixed after a review
against Thunder_Core `origin/develop`).
Branches: FE `feat/publish-changes` → `dev` · BE `feat/publish-changes` → `develop` (Thunder_Core).

## Slices

The work splits into three slices. **B is independent** and can ship first. **FE-A needs BE-A deployed**,
because the frontend proxies to the deployed backend.

### Slice B — default Program name (FE only, R2)

| File | Change |
|---|---|
| `publications/store/usePublicationDraftStore.ts` | Add `lastAutoName: string` (default `""`). A name counts as auto when `name === "" \|\| name === lastAutoName`. `BasicInfoForm` is not touched. **Bump the key `create-draft.v12` → `v13`.** A new field alone would shallow-merge fine (see the `furthestStep` note at `:209`). The reason for the bump is that an old draft's `lastAutoName` would be `""`, so a name the user typed there before the upgrade would be treated as not typed and then overwritten. |
| Where step 1 sets content: the pickers, and the URL seed in `CreatePublicationPage.tsx:225-245` | When the name is auto, set both `name` and `lastAutoName` from the content name, using the rules in the table below. |

Name rules (ADR 0078 §10):

| Content | Name |
|---|---|
| Playlist | the Playlist name |
| Composition | the Composition name |
| Media, one asset | that asset's title |
| Media, several assets | `<first title> +N` |

The URL seed carries only the id.
- **Asset seed:** `selectedAsset.title` is already loaded, so no fetch is needed.
- **Playlist or Composition seed:** fetch the name with the existing get call; do not add it to the URL.
  The fetch resolves after `setStep(2)` (`:243`), so the resolve handler must re-read
  `usePublicationDraftStore.getState()` and re-test the auto condition before writing. Otherwise a name
  the user types while the request is pending gets overwritten.

Check: add `default-program-name.check.mts` for the name rule as a pure function. It must cover 0, 1 and
several assets, and a typed name must never be overwritten.

### Slice BE-A — Thunder_Core RPCs + routes

One migration, `supabase/migrations/<ts>_publish_changes.sql`:

1. **Internal set helper** `media_core.publish_changes_targets(p_tenant_id, p_playlist_id, p_composition_id)`
   returns `SETOF uuid`.
   - It returns the publication ids from ADR §3: effective status `active` or `scheduled`, and membership
     is split by `publication_type`.
     - Playlist, direct: `publication_type <> 'composition' AND playlist_id = X`.
     - Playlist, through a Composition: `publication_type = 'composition'` and a `composition_zones` row
       bound to X.
     - Composition: `publication_type = 'composition' AND composition_id = X`.
   - Results are `DISTINCT` and `ORDER BY id`.
   - It is the single source used by both the list RPC and the bulk RPCs, so the list the user confirms
     cannot drift from what gets re-published.
2. `public.media_publish_changes_programs(p_tenant_id, p_playlist_id, p_composition_id) RETURNS jsonb`
   `{programs, programCount, channelCount}`.
   - It is built on the helper and serves both editors.
   - Each Program carries `id`, `name`, `status`, `startsAt`, `endsAt`, `channelCount`, and
     `viaComposition` (`{id, name}` or `null`).
   - The top-level `channelCount` is `DISTINCT channel_id` across all Programs.
   - The helper and this RPC both start with `IF num_nonnulls(p_playlist_id, p_composition_id) <> 1 THEN RAISE EXCEPTION 'Invalid input: pass exactly one of playlist or composition'`. Two nulls would otherwise return an empty list silently, and two values would be ambiguous.
3. `media_composition_programs_list` is **not touched**.
4. `public.media_playlist_publish_changes` and `public.media_composition_publish_changes`
   (`p_tenant_id, p_*_id, p_actor_id`) both `RETURNS jsonb {programCount, channelCount}`.
   - They loop over the helper in id order and call `media_publication_republish` for each Program.
   - Each call is wrapped in `BEGIN … EXCEPTION WHEN OTHERS`. An error with a known prefix is re-raised
     as `Invalid input: program "<name>" — <SQLERRM>`; any other error is re-raised unchanged
     (`RAISE;`).
   - Raise `not found:` when the Playlist or Composition is not in the tenant.
5. `REVOKE ALL … FROM PUBLIC` and `GRANT EXECUTE … TO service_role` for each new function. They are new
   functions, but CREATE grants PUBLIC by default (memory `create-function-grants-public`).

Routes follow the pattern of `publications/[id]/republish/route.ts`: `requireMediaTenant`, then
`callMedia`.

| Route | Handler |
|---|---|
| `GET media/playlists/[id]/affected-programs` | `media_publish_changes_programs` (playlist) |
| `GET media/compositions/[id]/affected-programs` | `media_publish_changes_programs` (composition) |
| `POST media/playlists/[id]/publish-changes` | `media_playlist_publish_changes` |
| `POST media/compositions/[id]/publish-changes` | `media_composition_publish_changes` |

Swagger entries for the four routes.

`affected-programs` is used instead of `/programs` because `compositions/[id]/programs` already exists and
serves the trash guard.

Verify at the SQL level on develop:
- a Playlist used directly and through a Composition with 2 Zones on the same Playlist gives the distinct
  count;
- a composition Program with a stale `playlist_id` is listed as indirect only;
- a quarantined asset in another Zone rolls everything back and the message names the Program;
- a draft or ended Program is untouched;
- `published_by` and `activated_at` change as expected.

Then verify through HTTP on the deployed develop.

**R0 gates:** apply the migration to develop, then to prod. Ask separately for each, and after each one
dump `prosrc` and compare it with the file.

### Slice FE-A — split button + modal (needs BE-A on develop)

| File | Change |
|---|---|
| `playlists/services/playlists-api.ts` | Add `getPlaylistAffectedPrograms` and `publishPlaylistChanges`. |
| `compositions/services/compositions-api.ts` | Add `getCompositionAffectedPrograms` and `publishCompositionChanges`. `CompositionProgramUsage` is unchanged. |
| new `publish/PublishSplitButton.tsx` | A Lovable `dropdown-menu` with the two items. Publish Changes is disabled with the hint "Not used by any program". |
| new `publish/PublishChangesDialog.tsx` | Lovable `dialog` with four states (confirm → publishing → updated / failed) plus a `readOnly` mode for "Used by". Takes `programs` and `onConfirm`, and knows nothing about Playlist vs Composition. The "failed" state parses the `program "<name>" — ` message; anything unparsed shows a generic line. |
| `playlists/components/PlaylistEditorHeader.tsx` | "Save Draft" becomes **"Save"**. The split button replaces "Publish →". Add a "Used by N programs" link. |
| `compositions/components/CompositionEditorHeader.tsx` | Same split button and link. "Save & Activate" is kept. |
| `PlaylistEditorPage.tsx`, `CompositionEditorPage.tsx` | Load the affected-programs list (no client-side filtering). Publish Changes saves first if dirty and aborts on a save error, then calls the bulk RPC and reloads the list. Publish to Channel… keeps the current route push. |

Where to put the shared `publish/` folder is decided at implementation time. Keep new files under 300 lines;
use Lovable primitives and tokens only (ADR 0075/0076).

Verify in the browser at the end (ask first for each verify point):
- Playlist used directly and through a Layout: the modal lists both, then Updated shows the right N and
  the Program detail shows a new snapshot.
- Playlist not used by any Program: the menu item is disabled.
- Dirty editor, then Publish Changes: the edit is saved and published.
- A forced failure (a quarantined asset) shows the named Program.
- Layout editor gives the same results.

## Order

1. Slice B, as its own Draft PR.
2. BE-A: write it, then R0 apply to develop, SQL checks, deploy develop (merge), HTTP checks.
3. FE-A against the deployed develop, with browser verification.
4. R0 apply to prod, then open the PR pair as Draft until verification is complete.

## Out of scope (ADR 0078)

- "Unpublished changes" badge
- Publish Changes on the Playlists list page
- role checks
