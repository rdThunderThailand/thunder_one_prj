# Playlist wizard: explicit "Save Draft" button + full-payload auto-save

Date: 2026-08-12
Status: approved, not yet implemented
Scope: `thunder_one_prj` frontend only — no backend change, no migration

## Problem

Two defects in the draft-save feature shipped by the `playlist-draft-save` sprint
(branch `feat/playlist`, PR #2, currently open as Draft):

1. **No explicit save affordance.** The playlist wizard has Back / Next / Create
   Playlist and nothing else. The operator cannot deliberately store work in
   progress; the only way to persist anything is to advance a step.

2. **The auto-save persists almost nothing.** `CreatePlaylistPage.goNext()`
   guards its write with `if (step === 1)`, and that write sends `name` only:

   | Transition | Written to DB |
   | --- | --- |
   | step 1 → 2 | `name`, `status='draft'` |
   | step 2 → 3 (media picked) | nothing |
   | step 3 → 4 (playback configured) | nothing |
   | Create Playlist | `name`, `metadata`, items, `status='active'` |

   A crash or refresh after picking media loses every item, every playback
   setting, and the description. What survives on the server is a name-only row
   that no list surfaces (`media_playlists_list` filters `status <> 'draft'`).
   This defeats the motivating reason recorded in ADR 0012 — "data loss on
   refresh/crash during a long edit".

### Why ADR 0012 rejected the button on a false premise

ADR 0012 states the draft row is created on first Next, "not behind a separate
'Save Draft' button — matches how publications trigger `persistDraft`".

Publications does both. Verified in the current code:

- `CreatePublicationPage.handleNext()` → `persistDraft(false)` on every step.
- `CreatePublicationPage.tsx:325` renders a `Save as Draft` button →
  `usePublishDraft.saveDraft()` → the same `persistDraft(false)`, plus a toast.

The comparison the ADR rested on was incomplete, so the rejection does not hold.

## Decision

Mirror publications properly: keep auto-save on Next, add the explicit button,
and make both write the complete draft payload.

### 1. Extract `persistDraft` into a hook

`CreatePlaylistPage.tsx` is 369 lines — already past the 300-line convention —
and duplicates the upsert + stale-draft-retry + conflict-classification block in
`goNext` (L134–181) and `handleSubmit` (L202–240). A third copy for the button is
not acceptable.

New file `src/features/playlists/hooks/usePlaylistDraftSave.ts`, modelled on
`usePublishDraft.persistDraft`. One exported operation:

```ts
persistDraft({ activate }: { activate: boolean }): Promise<string>
```

Sequence:

1. `metadata = encodeMetadata({ info, playback })`
2. `upsertPlaylist({ name, metadata, status, playlistId, expectedRevision, idempotencyKey })`
3. On a stale-draft error: re-mint the idempotency key, clear `playlistId` /
   `revision` / `editingId`, retry once as a fresh create. Moved verbatim from
   `goNext` L151–176 — behaviour must not change.
4. `setPlaylistItems(id, buildItemPayload())`
5. Sync `revision` from both responses into the store.
6. Rethrow on failure. The caller decides between the revision-conflict banner
   and a toast; this hook renders nothing.

Callers: `goNext`, `saveDraft` (new), `handleSubmit` (`activate: true`).
Expected to remove roughly 100 lines from the component.

### 2. `resolveDraftStatus` — the one pure decision

```ts
function resolveDraftStatus(existingId: string | null, activate: boolean): PlaylistStatus | undefined
```

| `existingId` | `activate` | result | meaning |
| --- | --- | --- | --- |
| null | false | `'draft'` | new row starts as a draft |
| null | true | `'active'` | create-and-activate in one call |
| set | false | `undefined` | omitted → RPC preserves current status |
| set | true | `'active'` | final submit / activate an existing draft |

`undefined` is load-bearing: `upsertPlaylist` only puts `status` in the body when
truthy (`playlists-api.ts:37`), and the RPC leaves the column alone when it is
absent. This is the behaviour commit `d96009d` established ("preserve status on
edit") and must not regress.

### 3. `goNext` — drop the step-1 guard

Remove `if (step === 1)`. Call `persistDraft({ activate: false })` on every
transition, after `validateStep` passes. Existing conflict-banner and
stale-error handling is unchanged; only the guard and the payload change.

### 4. `saveDraft` — the new button handler

- Gate on **non-empty name only**. It deliberately does *not* run `validateStep`
  — storing incomplete work is the entire point. Mirrors publications'
  `saveDraft`, which guards on `basicInfo.name` for the same reason.
- `persistDraft({ activate: false })`
- On success: `toast.success("บันทึกร่างแล้ว")`. `sonner` is already a
  dependency (used throughout publications); nothing new is added.
- On a revision conflict: let the existing banner show it, do not also toast.
- Does **not** reset the store and does **not** navigate. The operator stays on
  the current step.

### 5. Button placement

`<Button variant="secondary">Save Draft</Button>` between Back and Next in
`PageHeader.actions`, on steps 1 through 3.

**Not rendered on the last step.** Matches publications, and once Next persists
the full payload, everything is already saved by the time the Review step is
reached — the button would have nothing to do there.

### 6. Testing

`resolveDraftStatus` is extracted specifically so the branching is testable
without mounting the wizard. Pure logic modules in this feature live at the
feature root next to their check file (`step-validation.ts`, `metadata.ts`,
`duration.ts`), so it goes to `src/features/playlists/resolve-draft-status.ts`
with `src/features/playlists/resolve-draft-status.check.mts` covering the four
rows of the table above — `node:assert` only, run with `node <file>.check.mts`,
following the existing convention (`step-validation.check.mts`).

Nothing else here warrants a test: the rest is a call sequence against a live
backend, covered by the browser checklist.

### 7. ADR 0013

The rejection in ADR 0012 (lines 45–46) is superseded. Record it as a new ADR
0013 rather than editing 0012 — an ADR is a decision log, and rewriting a past
entry hides that the premise was wrong rather than documenting it. ADR 0013
states: publications has both mechanisms; playlists now match; the auto-save
payload was widened from name-only to the full draft.

## Explicitly out of scope

Deferred to a follow-up ("bundle B"), because it needs a new RPC, a new route,
and a production migration (R0):

- `media_playlist_delete` — confirmed absent from prod. `media_publication_delete`
  exists; `/media/playlists/[id]/route.ts` has GET and PATCH only, no DELETE.
- A Cancel button, and publications' `explicitlySaved` flag with its
  delete-the-orphan-draft-on-Cancel behaviour
  (`CreatePublicationPage.performCancel`, L200–212).
- Consequence of deferring: abandoned draft rows keep accumulating invisibly on
  prod. This is pre-existing, already accepted in ADR 0012 (L111–115), and is not
  a regression introduced by this change. Note that publications only cleans up
  on an explicit Cancel — closing the tab leaks a row there too, so bundle B
  would narrow the leak, not close it.

Also out of scope:

- No `localStorage` key bump. No new persisted field is introduced, so the
  existing `v2` key stays.
- No dirty-tracking (`isDirty` / `markSaved`). Those exist in publications to
  serve the Cancel confirmation, which is in bundle B.

## Risks

- **Empty item list on an early save.** `persistDraft` always calls
  `setPlaylistItems`, including with `[]` on the first Next of a new playlist
  (harmless — nothing to overwrite). In edit mode the risk would be writing `[]`
  before the `?id=` hydration effect populates `items`; the component's existing
  `hydrated` gate blocks render until the store has rehydrated, which keeps this
  closed. Always sending was chosen over skipping empty arrays so that removing
  every item and pressing Save Draft persists that intent instead of silently
  keeping the old items.
- **One extra API call per Next.** `setPlaylistItems` now runs on every step
  transition rather than once at submit. Accepted: it is the same wholesale
  replace publications already performs per Next via `savePublicationContent`.
- **`revision` staleness.** `setPlaylistItems` bumps `revision` server-side and
  returns it; step 5 of `persistDraft` must consume that value, or the next save
  self-conflicts. Publications hit exactly this bug and fixed it by re-fetching
  (`usePublishDraft.ts` L236–244); here the response already carries `revision`,
  so no extra fetch is needed.

## Verification plan

- `pnpm tsc --noEmit` clean.
- `node src/features/playlists/resolve-draft-status.check.mts` passes.
- Browser checklist (requires Thunder_Core PR #29 deployed first — the frontend
  calls the deployed backend, not local code):
  1. New playlist → fill name → Next → row exists with `status='draft'`.
  2. Step 2, pick media → Save Draft → toast → reload → items still there.
  3. Step 3, change playback → Next → refresh → settings survive.
  4. Save Draft with an empty name → blocked with a message, no API call.
  5. Finish the wizard → row flips to `status='active'`, appears in `/playlists`.
  6. Two tabs editing the same draft → second save shows the revision-conflict
     banner, not a silent overwrite.

Per the working agreement, ask before running the browser pass; steps 1–6 above
are equally usable as a checklist handed to the operator.
