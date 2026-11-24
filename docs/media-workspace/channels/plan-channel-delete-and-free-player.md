# Channel delete and free Player — Implementation Plan (ADR 0122 phase 1)

> **For agentic workers:** execute one PR at a time (§2 of the owner's CLAUDE.md: a `sonnet` subagent per
> PR, the main session reads `git diff` before reporting). Steps use `- [ ]`. Never commit, push, or apply
> a migration unless the owner says so. Stop and report on a design fork or anything irreversible.

**Goal:** an operator can deactivate, activate, and delete a Channel that is not in use, give a Channel
no Player yet, and see why the Player is locked while a Program is live.

**Architecture:** three PRs in order. **A** (One, FE only) shows lifecycle actions by stored status,
adds Activate, "No player yet" and Save as Draft, and moves Channel feedback to toasts. **B** (Core, one
migration) widens the in-use check to Groups, guards the Active-needs-a-Player rule, lets
`media_channel_delete` hard-delete a never-used Channel in any status, and returns the blocking Programs
on the Channel detail. **C** (One, after B is deployed) turns on Delete for every status and the locked
Player notice. Phase 2 (Tombstone) is out of scope.

**Tech stack:** Next.js (read `node_modules/next/dist/docs/` before touching framework code), sonner 2,
Supabase plpgsql. Checks are `*.check.mts` run with `node <file>` — no test runner in either repo.

**Spec:** [ADR 0122](../../adr/0122-deleting-an-unused-channel-tombstones-it-and-frees-its-player.md)
(rules 1–10) and [ADR 0123](../../adr/0123-success-is-a-toast-failure-stays-inline-decisions-are-dialogs.md).

## Confirmed facts — do not re-derive

Read on 2026-11-20 (prod `sfiefevtxalqjizdkcsw`, read-only; FE `dev`; Core `origin/develop` 653fd89).

- Prod: 72 Channels are stored `active`, hold a reservation, have no `publication_targets`; 68 of them
  also have no Group membership, no `publication_snapshot_group_members` row and no `playback_logs`.
- FE gating today: `ChannelLifecycleActions.tsx:70` returns `null` for `lifecycle === "inactive"`; Deactivate
  only for `lifecycle === "active"`, Delete only for `"draft"`. `ChannelRowActionsMenu.tsx:31`
  `canDisable = channel.lifecycle === "active"`. `ChannelListItem.status` (types/index.ts:88) is the stored
  status; `ChannelDetail extends ChannelListItem`.
- `EditChannelSidebar.tsx:122` renders `ChannelLifecycleActions` with `lifecycle={channel.lifecycle}`.
- `channels-api.ts` has `deleteDraftChannel(id, expectedRevision)` (L364) and
  `deactivateChannel(id, expectedRevision): Promise<ChannelDetail>` (L368), each with a
  `build…Request` descriptor checked in `services/channels-api-contract.check.mts`. No activate client.
- `create-wizard-state.ts`: `step2Valid` = `draft.playerId !== null` (L47); `toCreateChannelPayload`
  throws without a Player (L94); `UpdateChannelPayload extends CreateChannelPayload` (L109).
- `channel-write-api.ts:12` sends `as_draft: false` on create; update sends no `as_draft`.
- `PlayerPickerField` props: `candidates, selectedId, loading, excludeChannelId?, onSelect, onRefresh`.
- `ChannelEditorPage.tsx:89-90`: save then `router.push("/media-workspace/channels")`, no feedback.
- `src/app/layout.tsx:85`: `<Toaster position="top-right" richColors />`.
- Core routes: `src/app/api/core/v1/media/channels/[id]/route.ts` (GET → `media_channel_get`, PATCH →
  `media_channel_update` with `p_player_id: input.player_id ?? null`, DELETE → `media_channel_delete`),
  `[id]/activate`, `[id]/deactivate`. `callMedia` passes through messages starting `Invalid input:`,
  `not found:`, `Unauthorized`, `Permission denied`, `Already `.
- Core SQL (baseline `supabase/migrations/20261026235959_baseline_from_prod.sql`): 
  `media_core.channel_blocking_publications(p_tenant_id, p_channel_id) returns text` counts only
  `target_type = 'channel'` with `publication_effective_status(...) IN ('active','scheduled')`.
  `media_channel_deactivate` already refuses Group members (`Invalid input: remove this channel from its
  groups before deactivating: %`). `media_channel_delete` refuses `status <> 'draft' OR activated_at IS
  NOT NULL`. `channel_set_devices(NULL)` deletes the Player and reservation when nothing blocks.
- FKs to `media_core.channels`: CASCADE from `channel_devices`, `channel_device_reservations`,
  `channel_group_members`, `publication_targets`; SET NULL from `playback_logs`. `playback_logs`
  (1.67 M rows) has **no index on `channel_id`**.
- Core migrations: `supabase migration new` only; run `scripts/migration-guards.sh` and
  `scripts/db-dry-run.sh` before the PR; CI pushes develop on merge — never `db push` yourself, never MCP
  `apply_migration`. Signature change → `DROP FUNCTION IF EXISTS <old>` first, then re-`GRANT`/`REVOKE`.

## Global constraints

- Media Workspace tokens only (`src/design-system/t1-tailwind-v4.css`); no raw palette, hex, or new `dark:`.
- Icons from `src/components/ui/icons.tsx`; Button, Dialog/Modal from `src/components/ui/`.
- Media UI copy is English. Raw backend text never reaches the screen; map through `classifyApiError`.
- Files ≤ 300 lines, no `any`, JSX one element per line, no new dependency.
- Feedback (ADR 0123): success → `toast.success`; failure → inline in the card/form; decision → dialog.
- Core: every new plpgsql function filters `tenant_id` itself (tenant isolation is in RPCs, not RLS).

## Review focus

1. Deactivate then Delete without reload: the second call must use the revision returned by the first
   (`onChanged(detail)`), or Core answers `Already modified`. → A1 check + C1 manual step.
2. A Channel in a Group: Deactivate (today) and Delete (B3) refuse with the Group names, shown inline.
   → B HTTP check 4, C1 manual step.
3. Activate when the Player is reserved by another Active Channel: inline `In use by <holder>`, Channel
   stays Draft/Inactive. → A3 manual step, B HTTP check 6.
4. A Program targets the Channel after the page loaded, then Delete: Core refuses; the dialog shows the
   refusal inline and does not close. → B HTTP check 3, C1 manual step.
5. Player-less Draft: Activate disabled with "Select a Player first"; the list's "No player" filter still
   matches it. → A1 check, A4 manual step.

---

## PR A — One: actions by stored status, Activate, No player, toasts

Branch `fix/media-workspace-channel-lifecycle-actions` from `origin/dev`. No Core change needed.

### Task A1: lifecycle gating as one pure function

**Files:**
- Create: `src/features/media-workspace/channels/lifecycle-actions.ts`,
  `src/features/media-workspace/channels/lifecycle-actions.check.mts`
- Modify: `components/ChannelLifecycleActions.tsx`, `components/ChannelRowActionsMenu.tsx`,
  `components/EditChannelSidebar.tsx`

**Interfaces:**
- Produces: `lifecycleActionsFor(input: { status: ChannelLifecycle; hasPlayer: boolean }):
  { canDeactivate: boolean; canActivate: boolean; activateBlockedReason: string | null; canDelete: boolean }`.
  PR C adds `blockingPrograms` to the input.

- [ ] Write `lifecycle-actions.check.mts` with `node:assert/strict`:
  - `{status:"active", hasPlayer:true}` → `canDeactivate true, canActivate false, canDelete false`
    (Delete for non-Drafts waits for PR C).
  - `{status:"inactive", hasPlayer:true}` → `canDeactivate false, canActivate true, activateBlockedReason null`.
  - `{status:"draft", hasPlayer:false}` → `canActivate false`, `activateBlockedReason "Select a Player first"`,
    `canDelete true`.
  - `{status:"inactive", hasPlayer:false}` → `canActivate false`, same reason.
- [ ] Run `node src/features/media-workspace/channels/lifecycle-actions.check.mts` → fails (module missing).
- [ ] Implement `lifecycleActionsFor` in `lifecycle-actions.ts`.
- [ ] Run the check → passes.
- [ ] `ChannelLifecycleActions` takes `status` and `playerName: string | null` instead of `lifecycle`
  (calls `lifecycleActionsFor({ status, hasPlayer: playerName !== null })`; the name feeds A2's toasts),
  deletes the `if (lifecycle === "inactive") return null` branch, and renders from the result. Update the
  doc comment that says there is no Activate by design (it now cites ADR 0122 rule 3).
  `EditChannelSidebar` passes `status={channel.status}` and `playerName={channel.player?.name ?? null}`.
- [ ] `ChannelRowActionsMenu`: `canDisable = lifecycleActionsFor({ status: channel.status, hasPlayer: true }).canDeactivate`.
- [ ] Run `npx tsc --noEmit` and `npx eslint src/features/media-workspace/channels` → clean.

### Task A2: toasts for Channel feedback (ADR 0123)

**Files:** Modify `src/app/layout.tsx`, `components/ChannelEditorPage.tsx`,
`components/ChannelLifecycleActions.tsx`.

- [ ] In `layout.tsx` drop `richColors` and pass `toastOptions={{ classNames: { … } }}` built from token
  classes (`bg-card`, `text-foreground`, `border-border`; `success` / `error` variants use
  `text-success` / `text-error` and their `*-muted` backgrounds). No wrapper component.
- [ ] `ChannelEditorPage` save: `toast.success("Channel saved")` right before `router.push`.
- [ ] Deactivate success: `toast.success(\`Channel deactivated — ${playerName} is free\`)`, or
  `"Channel deactivated"` when there is no Player. Errors stay inline as today.
- [ ] `node src/design-system/design-system.check.mts` → passes; open any page that already toasts
  (Playlist save) and confirm the toast still reads on light and dark.

### Task A3: Activate button

**Files:** Modify `services/channels-api.ts`, `services/channels-api-contract.check.mts`,
`components/ChannelLifecycleActions.tsx`.

**Interfaces:**
- Produces: `buildActivateChannelRequest(id: string, expectedRevision: number): ChannelRequestDescriptor`
  and `activateChannel(id: string, expectedRevision: number): Promise<ChannelDetail>`, shaped exactly like
  the deactivate pair (POST `/media/channels/{id}/activate`, body `{ expected_revision: expectedRevision }`
  as in `buildDeactivateChannelRequest`, channels-api.ts:304; Core's activate route reads
  `input.expected_revision`, same as deactivate).

- [ ] Add an assertion to `channels-api-contract.check.mts` for the activate descriptor (method, path,
  body) mirroring the deactivate one; run it → fails.
- [ ] Implement the pair; run the check → passes.
- [ ] Lifecycle card: Activate button when `canActivate`; disabled with `title={activateBlockedReason}`
  when a reason exists. Success → `onChanged(detail)` + `toast.success("Channel activated")`. Failure →
  inline via `classifyApiError(caught, "Could not activate this Channel. Try again.")`; Core's
  `Already in use: these devices are reserved by another active channel: …` already passes through.

### Task A4: "No player yet" and Save as Draft

**Files:** Modify `components/create-wizard/PlayerPickerField.tsx`, `create-wizard-state.ts`,
`create-wizard-state.check.mts`, `services/channel-write-api.ts`,
`components/create-wizard/CreateChannelModal.tsx` (or the step that owns the submit button),
`components/ChannelEditorForm.tsx`, `components/ChannelEditorPage.tsx`.

**Interfaces:**
- `PlayerPickerField` gains `allowNone?: boolean` and `onClear?: () => void`. With `allowNone`, the
  first row of the list is "No player yet"; picking it calls `onClear`.
- `withoutPlayer(draft: CreateChannelDraft): CreateChannelDraft` (sets `playerId: null`, clears what
  `withPlayer` derived from the Player).
- `CreateChannelPayload.player_id: string | null`; `toCreateChannelPayload` no longer throws.
- `createChannelV2` sends `as_draft: payload.player_id === null`.

- [ ] In `create-wizard-state.check.mts` assert: `step2Valid(DEFAULT_CREATE_CHANNEL_DRAFT) === true`;
  `toCreateChannelPayload(DEFAULT_CREATE_CHANNEL_DRAFT).player_id === null`;
  `withoutPlayer(withPlayer(draft, candidate)).playerId === null`. Run → fails.
- [ ] Implement; run → passes. Update any other caller of `step2Valid` / `toCreateChannelPayload` that
  assumed a Player (grep both names).
- [ ] Wizard: always `allowNone`; the final button reads `draft.playerId ? "Create" : "Save as Draft"`;
  on a Draft save, `toast.success("Saved as Draft — add a Player, then Activate")`.
- [ ] Edit page: `allowNone={channel.status !== "active"}` (Draft and Inactive only — ADR 0122 rule 4).
- [ ] `npx tsc --noEmit`, eslint, every `channels/**/*.check.mts` → clean.

### PR A verification (ask the owner before the browser run — CLAUDE.md §3)

Browser on local dev against deployed develop, tenant with a test Channel `zz-0122-a`:
create without Player → Draft + toast; pick a Player → Activate → Active + toast; on a stored-active
Channel with no Program the card shows Deactivate → Deactivate → toast, Player free in another
Channel's picker; edit an Inactive Channel → "No player yet" selectable; on an Active Channel it is not.
Not covered: Delete of non-Drafts (PR C).

---

## PR B — Core: in-use via Groups, Player guard, phase-1 delete, blocking Programs

Branch `fix/channel-delete-unused` from `origin/develop` in Thunder_Core. One migration:
`supabase migration new channel_delete_unused`. Base every function body on `pg_get_functiondef` from
develop, not on an old migration file.

### Task B1: `channel_blocking_publication_rows` and the Group paths

- [ ] Create `media_core.channel_blocking_publication_rows(p_tenant_id uuid, p_channel_id uuid)
  RETURNS TABLE (id uuid, name text)` — `SECURITY` and `search_path` as the existing helper — returning the
  Programs whose `publication_effective_status` is `active` or `scheduled` and that reach the Channel by:
  (a) a `target_type = 'channel'` row; (b) a `target_type = 'group'` row for a Group the Channel is in now;
  (c) the Channel's row in `publication_snapshot_group_members` of the Program's newest snapshot (newest =
  the snapshot of its newest Publish Job, the BE-0 rule `media_job_poll` uses). Distinct, ordered by name, id.
- [ ] Rewrite `channel_blocking_publications` as `string_agg(name, ', ' ORDER BY name, id)` over the new
  function. Same signature, so `CREATE OR REPLACE` is safe; keep its grants.
- [ ] Re-`REVOKE`/`GRANT` the new function to match the old helper (CREATE grants PUBLIC by default).

### Task B2: an Active Channel always has a Player

- [ ] In `public.media_channel_update`, after `channel_lock`: when `p_player_id IS NULL` and the locked
  Channel's `status = 'active'`, `RAISE EXCEPTION 'Invalid input: an active channel needs a player'`.
  Signature unchanged.

### Task B3: phase-1 `media_channel_delete`

- [ ] Keep the signature. After `channel_lock` (`FOR UPDATE`), in this order:
  1. Group members → `RAISE EXCEPTION 'Invalid input: remove this channel from its groups before deleting: %'` (Group names).
  2. `channel_blocking_publications` not null → `'Already in use: these publications still target this channel: %'`.
  3. Any `publication_targets`, `publication_snapshot_group_members` or `playback_logs` row for the
     Channel → `'Already in use: this channel has Program or playback history and cannot be deleted yet'`.
  4. `DELETE` the row (cascade frees the Player). The checks run after the lock; FK inserts take
     `FOR KEY SHARE` on the Channel row, so a concurrent insert waits or is seen (ADR 0122 rule 8).
- [ ] Drop the `status <> 'draft' OR activated_at IS NOT NULL` refusal.
- [ ] `CREATE INDEX playback_logs_channel_id_idx ON media_core.playback_logs (channel_id) WHERE channel_id IS NOT NULL;`
  — plain `CREATE INDEX` (a migration runs in a transaction); it blocks `playback_logs` writes for the
  build. Say so in the PR's Migration section.

### Task B4: blocking Programs on the Channel detail

- [ ] `media_channel_get` adds `blocking_programs: [{ id, name }]` from
  `channel_blocking_publication_rows` (empty array when none). If the route has a response schema in
  `channels/schema.ts`, extend it and its `schema.check.mts`; run `node src/app/api/core/v1/media/channels/schema.check.mts`.
- [ ] Update the per-consumer swagger for `GET /media/channels/{id}` if it lists fields.

### PR B verification

- [ ] `scripts/migration-guards.sh`, `scripts/db-dry-run.sh`, `npx tsc --noEmit`, `npm run lint` → clean.
- [ ] After merge (CI pushes develop), HTTP against `thundercoredev.vercel.app`, test rows prefixed `zz-0122-`:
  1. DELETE a never-used Active Channel → 200; its Player shows available in `player-candidates`.
  2. DELETE a Channel that a Cancelled Program targets → 409-class `Already in use: … history …`.
  3. DELETE a Channel with an Active Program → refusal naming the Program.
  4. DELETE a Channel in a Group → `remove this channel from its groups`.
  5. PATCH `player_id: null` on an Active Channel → `Invalid input: an active channel needs a player`.
  6. Activate a Draft whose Player another Active Channel holds → `Already in use … (held by …)`.
  7. GET a Channel targeted through a live Group Program → `blocking_programs` lists it.
- [ ] Dump `prosrc` of the changed functions from develop and compare with the file (CLAUDE.md §6).
- [ ] Test rows cleanup is R0: list them for the owner, delete only on a yes.

---

## PR C — One: Delete in any status, locked Player notice (after PR B is on develop)

Branch `feat/media-workspace-channel-delete` from `origin/dev`.

### Task C1: Delete for every unused Channel

**Files:** `lifecycle-actions.ts` + check, `services/channels-api.ts` + contract check,
`components/ChannelLifecycleActions.tsx`, `components/ChannelRowActionsMenu.tsx`.

- [ ] Rename `deleteDraftChannel` → `deleteChannel` (same request); update callers.
- [ ] `lifecycleActionsFor` input gains `blockingPrograms: { id: string; name: string }[]`; check:
  any non-empty list → `canDeactivate`, `canDelete` false and a `blockedReason` naming the Programs;
  empty list → `canDelete` true for every status.
- [ ] Delete dialog (Dialog from `src/components/ui/`): title `Delete "<name>"?`; body
  `<player> becomes available for another Channel.` (omit when Player-less) and `This can't be undone.`;
  confirm button `Delete Channel`. A refusal stays inline in the dialog. Success →
  `toast.success(\`Channel deleted — ${playerName} is free\`)` (or `"Channel deleted"`), then `onDeleted()`.
- [ ] Row "…" menu adds `Delete Channel` opening the same dialog.

### Task C2: locked Player notice

**Files:** `services/channels-api.ts` (`parseChannelDetail`) + contract check, `types/index.ts`,
`components/ChannelEditorPage.tsx` / `ChannelEditorForm.tsx`, `components/ChannelLifecycleActions.tsx`.

- [ ] `ChannelDetail.blocking_programs: { id: string; name: string }[]` parsed with a default of `[]`;
  contract check covers present and missing.
- [ ] When non-empty: a persistent notice above the picker — `Player is locked while these Programs are
  live or scheduled: <links>. Cancel them or wait for them to end.` — each name links to the Program;
  the picker is disabled; Deactivate/Delete disabled with the same names in `title`.

### PR C verification (ask before the browser run)

Delete a never-used Active Channel → toast, Player free; Delete a Channel with history → inline refusal;
Channel with a live Program → notice, locked picker, disabled buttons; Channel in a Group → inline
Group refusal. Then the release order: Core B to main, then One A+C (`docs/agents/versioning.md`).

## Not in this plan

- ADR 0122 phase 2 (Tombstone, rules 11–17) — its own plan once guards 14–16 are designed.
- Swapping a Player under a live Program (deferred issue).
- Moving the other 36 `toast.error` calls (ADR 0123 rule 5).
