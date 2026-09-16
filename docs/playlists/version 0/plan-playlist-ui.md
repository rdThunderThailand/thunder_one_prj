# Plan — Playlist UI (overview + 4-step wizard)

Status: Phase 1 in progress.
Decided in a grilling session on 2026-08-11; every fork below is settled, not open.

## Confirmed facts — do not re-derive

Backend (`Thunder_Core/src/app/api/core/v1/media/playlists/`):

| Endpoint | Accepts / returns |
| --- | --- |
| `GET /media/playlists` → `media_playlists_list` | `id, name, status, item_count, created_at`; filters `kind = 'user'` |
| `GET /media/playlists/{id}` → `media_playlist_get` | the above + `items[]`; no `kind` filter since migration 066 |
| `POST` / `PATCH` → `media_playlist_upsert` | **only** `name` + `status ('active' \| 'inactive')` |
| `PUT /{id}/items` → `media_playlist_set_items` | `media_asset_id, position, duration_seconds, transition` |

- `media_core.playlists` has an unused `metadata jsonb NOT NULL DEFAULT '{}'` column and
  `UNIQUE (tenant_id, name)`. No `created_by`.
- `playlist_items.transition` is `CHECK (transition IN ('cut','fade'))`. Slide/Wipe do not exist.
- `media_job_poll` (migration 068) reads exactly two fields off `playlist_items`:
  `COALESCE(pi.duration_seconds, ma.duration_seconds)` and `pi.transition`. **Nothing else in a
  playlist reaches a screen.**
- There is no DELETE and no duplicate endpoint for playlists.
- `requireMediaTenant()` already returns `userId` — the playlists routes just never use it.
- `fetchCampaigns()` and `fetchTags()` already exist in `features/publications/services/publications-api.ts`.
- Publications' `created_by` shape (migrations 077/079) is `{ id, display_name }` or null.

## Scope decisions

Out of scope, deliberately — `CONTEXT.md` puts these on Publication, not Playlist:
Channels/Locations, Schedule, the `Scheduled` / `Expired` stat cards, "Shared with me",
and the Duration column in the list table (would need one `GET /{id}` per row).

Also cut: file upload for the cover, Delete, Duplicate, Slide/Wipe transitions.
Archive is `status: active ↔ inactive`.

## Metadata contract (`metadata` jsonb, v1)

```jsonc
{
  "v": 1,
  "info":     { "description", "campaign_id", "tags": ["<tag id>"],
                "playlist_type", "resolution", "frame_rate", "cover_asset_id" },
  "playback": { "play_mode", "repeat", "start_from", "default_image_duration",
                "media_fit", "audio_enabled", "default_volume",
                "default_transition", "transition_duration",
                "failure_handling", "warn_on_skip" }
}
```

Only keys with a value are written, so a pre-existing `{}` reads back fine with no backfill.
`v: 1` exists so a later shape change can be detected instead of crashing on old rows.

Everything under `playback` except `default_image_duration` and `default_transition` is inert —
those two are wizard-level defaults that get baked into each `playlist_items` row, which is the
only path to a screen. See `docs/adr/0010-playlist-settings-in-metadata.md`.

`cover_asset_id` is written **only** when the operator explicitly picks a cover. The fallback
(`cover_asset_id ?? items[0]`) is resolved at read time, so reordering items never has to
write anything back.

## Phase 1 — frontend only (no backend dependency)

Works against today's deployed backend: the extra `metadata` field is dropped silently by the
route's zod schema, so nothing errors — the wizard just cannot persist those fields yet.

1. Promote shared pieces out of `features/publications`:
   - `MediaThumb.tsx` → `src/components/ui/MediaThumb.tsx`
   - `usePreviewUrls.ts` → `src/hooks/usePreviewUrls.ts`
   - `requestApi` + `fetchPreviewUrls` → `src/lib/api/media-api.ts`

   Publications imports from the new locations; no logic changes. `AssetCard` and `ContentStep`
   stay put — they are bound to the publication draft store.
2. `features/playlists/types/index.ts` — `Playlist`, `PlaylistListItem`, `PlaylistDetail`,
   `PlaylistMetadata`, `PlaylistDraft`.
3. `features/playlists/metadata.ts` + `metadata.check.mts` — encode/decode v1, resolve cover.
4. `features/playlists/step-validation.ts` + `step-validation.check.mts` — step 1 needs a name,
   step 2 needs ≥1 item. Mirrors `docs/adr/0001-wizard-step-contract.md`.
5. `features/playlists/services/playlists-api.ts` — list, get, create, update, set items.
6. `features/playlists/store/usePlaylistDraftStore.ts` — zustand + persist,
   key `thunderone.playlists.create-draft.v1`.
7. Components: `PlaylistsListPage`, `PlaylistDetailPanel`, `PlaylistStepper`,
   `CreatePlaylistPage`, `BasicInfoStep`, `ContentStep`, `SettingsStep`, `ReviewStep`.
8. Routes: `/playlists`, `/playlists/create`, `/playlists/create?id=<uuid>` (edit mode —
   prefills from the API instead of localStorage, final button reads "Save Changes").

Wizard behaviour, which differs from the publications wizard on purpose:

- `Next` is `validateStep → setStep`. **No network call anywhere in the wizard.**
- `Create Playlist` fires two calls: `POST /media/playlists` then `PUT /{id}/items`. If the
  second fails, the returned `playlistId` stays in the store and the user gets a retry that
  re-sends only the items — there is no DELETE to roll back with, and re-creating would hit
  `UNIQUE (tenant_id, name)` anyway.
- No `✕`. `Back` walks the steps down and leaves to `/playlists` from step 1, with no
  confirmation dialog. The draft survives in localStorage; returning shows a
  "draft in progress / start over" banner.

## Phase 2 — migration + backend routes (R0, needs explicit approval before applying)

Apply via Supabase MCP `apply_migration`. Copy every function body verbatim from
`pg_get_functiondef()` on prod, never from an older migration file (the migration-071 lesson).

1. `ALTER TABLE media_core.playlists ADD COLUMN created_by uuid REFERENCES public.users(id) ON DELETE SET NULL`
2. `media_playlist_upsert` gains `p_metadata jsonb` and `p_created_by uuid`; `created_by` is
   written on INSERT only, so editing never reassigns the creator.
   **`DROP FUNCTION IF EXISTS public.media_playlist_upsert(uuid,uuid,varchar,varchar)` first** —
   adding a parameter to `CREATE OR REPLACE` creates a second overload and makes every existing
   call ambiguous.
3. `media_playlist_get` returns `metadata` and `created_by {id, display_name}`. Signature
   unchanged, so plain `CREATE OR REPLACE`.
4. `media_playlists_list` returns `metadata`, `created_by`, and a resolved `cover_asset_id`
   (`COALESCE(metadata->>'cover_asset_id', first item)`), where "first item" is
   `ORDER BY position, id` — `position` alone is unique per playlist but the tiebreak keeps it
   deterministic if that ever changes. Signature unchanged.
5. `media_playlist_upsert` should catch `unique_violation` and
   `RAISE EXCEPTION 'Already exists: a playlist named "%" exists', p_name`. Confirmed on
   2026-08-11: creating a playlist whose name is taken raises the raw Postgres
   `duplicate key value violates unique constraint "playlists_tenant_id_name_key"`, which
   does not match `callMedia`'s `EXPECTED_ERROR` regex
   (`/^(Invalid input:|not found:|Unauthorized|Permission denied|Already )/`), so the route
   masks it as `Media operation failed` and returns 500. The `Already ` prefix is what makes
   it pass through. The frontend guards against this client-side already, but a race between
   two operators can still reach the RPC.
6. Thunder_Core routes: accept `metadata` in the zod schemas, pass `userId` through.
   **Must be merged to `develop` and deployed** — the frontend calls `thundercore.vercel.app`,
   not local code.

After applying, dump `prosrc` back and diff it against the migration files.

## Phase 3

Turn on cover thumbnails, `created_by`, and the metadata-backed fields in the UI, then verify
through a real browser session.

## Docs

- `CONTEXT.md` — Playlist entry extended with cover, the inert playback settings, and `created_by`.
- `docs/adr/0010-playlist-settings-in-metadata.md`.
