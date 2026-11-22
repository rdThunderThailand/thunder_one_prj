# Channel Tombstone — Implementation Plan (ADR 0122 phase 2)

> **For agentic workers:** execute one PR at a time (§2 of the owner's CLAUDE.md: a `sonnet` subagent per
> PR, the main session reads `git diff` before reporting). Steps use `- [ ]`. Never commit, push, or apply
> a migration unless the owner says so. Stop and report on a design fork or anything irreversible.

**Goal:** an operator can delete a Channel that is not in use even when it has history. The Channel
leaves every live screen, its Player is free, its name can be reused, and past Programs and Playback
Proof still show it as `<name> (deleted)`.

**Architecture:** three PRs, **in this order**. Nothing creates a Tombstone before the last one.

- **S1 + S2 (Core, one migration, no behaviour change):** adds `deleted_at` and its CHECK, the guards
  of rules 14–16, the reader changes of rule 13, the new fields of rules 17 and 20, and the history-test
  helper.
- **S4 (One, FE):** adds the target notice and Remove in the wizard and on the edit page, the
  `(deleted)` labels, the error mapping, and the two-mode delete dialog. Every new field is optional, so
  S4 works against S1 + S2 whether or not S3 is out.
- **S3 (Core, one migration):** `media_channel_delete` starts to Tombstone a Channel with history, and
  the name constraint becomes a partial unique index.

**Tech stack:** Next.js (read `node_modules/next/dist/docs/` before touching framework code), Supabase
plpgsql. Checks are `*.check.mts` run with `node <file>` — no test runner in either repo.

**Spec:** [ADR 0122](../../adr/0122-deleting-an-unused-channel-tombstones-it-and-frees-its-player.md)
rules 11–20 (phase 2, amended 2026-11-22). Phase 1 plan:
[plan-channel-delete-and-free-player.md](plan-channel-delete-and-free-player.md).

## Confirmed facts — do not re-derive

Read on 2026-11-22 (prod `sfiefevtxalqjizdkcsw`, read-only; FE `dev` 837ca31e; Core `origin/develop`).

- Prod: 84 Channels not in use; 68 no history, 4 in a Group, 2 history only via Draft/Cancelled
  Programs, 10 with `playback_logs`. No Draft Channels. No duplicate names.
- `media_core.channels` has no `deleted_at`. `channels_tenant_id_name_key` = `UNIQUE (tenant_id, name)`.
  `channels_status_check` allows `draft`, `active`, `inactive`.
- `channel_lock(p_tenant_id, p_channel_id, p_expected_revision, p_overwrite)`: `SELECT … FOR UPDATE`,
  `not found: channel not found`, then `Already modified: channel was changed elsewhere`.
- Phase-1 `media_channel_delete`: lock → Group refusal → `channel_blocking_publications` refusal →
  history refusal (`publication_targets` / `publication_snapshot_group_members` / `playback_logs`,
  Core `supabase/migrations/20261121100502_channel_delete_unused.sql:187-191`) → `DELETE` →
  `channel_audit('channel_delete', …)` → returns `{id, deleted: true}`.
- `media_publication_activate`: `FOR UPDATE` on the publication and composition, `FOR SHARE … ORDER BY
  ma.id` on Assets. Channels are checked with a plain join and no lock; the error is `these channels are
  not active — activate them before publishing: <names>`.
- `media_channel_groups_set_members` and `media_channel_set_groups` check `status <> 'active'` with plain
  joins, then `DELETE`/`INSERT` `channel_group_members`. `media_channel_groups_update` changes only the
  Group's own attributes.
- `media_publication_upsert` checks a Channel target only for existence and tenant.
  `media_publication_get` returns targets as `target_type, channel_id, device_id, group_id, name`, with
  `name = COALESCE(a.name, ch.name, cg.name)`.
- `media_publication_duplicate` copies every `publication_targets` row of the source Program.
- FE:
  - **Draft entry point:** Draft Edit and Publish open the wizard at `/media-workspace/program/create?id=`
    (`PublicationRowActions.tsx:43-50`).
  - **Wizard targets:** the wizard loads every target id (`CreatePublicationPage.tsx:118`). It draws
    Channels from the Channel list (`ChannelsStep.tsx`).
  - **Rail:** `ProgramSummaryRail.tsx` takes its names from the list but counts `channelIds.length`, which
    includes hidden ids.
  - **Edit page:** `ChangeTargetModal` → `SelectedTargetPanel` already lists every selected target under
    its saved name, with Remove (`target-picker.ts` `targetsFromSelection`).
  - **Notice to model on:** `LayoutNotActiveNotice.tsx`, used in `PublicationEditPage.tsx` and
    `CreatePublicationPage.tsx`.
  - **Payload names:** Program detail (`PublicationDetailPage.tsx:477`) and Playback Proof
    (`playback-proof-api.ts:15`, `PlaybackProofTable.tsx:100-110`) take Channel names from the payload.
  - **Error mapping:** publish refusals are mapped to Thai in `src/lib/api/publish-cause.ts`
    (`channels are not active` → cause `channels-inactive`); `api-error.check.mts` asserts they are Thai.
  - **Delete dialog:** `DeleteChannelDialog` gets `blockingPrograms = []` from the list row menu
    (`ChannelRowActionsMenu.tsx`). Refusals are mapped in `channels/delete-refusal.ts`.

## Global constraints

- Media Workspace tokens only (`src/design-system/t1-tailwind-v4.css`); no raw palette, hex, or new `dark:`.
- Icons from `src/components/ui/icons.tsx`; Button, Dialog/Modal from `src/components/ui/`.
- Media UI copy is English. Raw backend text never reaches the screen; map through `classifyApiError`.
- Files ≤ 300 lines, no `any`, JSX one element per line, no new dependency.
- Feedback (ADR 0123): success → `toast.success`; failure → inline; decision → dialog.
- Core:
  - Every new plpgsql function filters `tenant_id` itself.
  - Base every changed body on `pg_get_functiondef` from develop, not on an old migration file.
  - A signature change needs `DROP FUNCTION IF EXISTS <old signature>` first.
  - After `CREATE`, `REVOKE`/`GRANT` again to match the old function (`CREATE` grants PUBLIC).
  - Migrations ship only through `supabase db push` with `scripts/migration-guards.sh` and
    `scripts/db-dry-run.sh`. Never MCP `apply_migration`. A prod push is R0.
- Core work goes in a new worktree from `origin/develop`. The main Thunder_Core checkout is on someone
  else's branch. Copy the `.env*` files into the worktree first.

## Review focus

1. Race with Delete. Publish, or add to a Group, while S3's Delete runs on the same Channel. The writer
   either waits and then refuses, or Delete waits and then refuses as in use. → S1 HTTP check 4.
2. A Draft that targets a Tombstone. Open it in the wizard and on the edit page: the notice names it and
   Remove clears it. Publish refuses until then. → S4 manual steps, S3 HTTP check 3.
3. Duplicate an Ended Program whose Channel is a Tombstone: the new Draft opens with the notice.
   → S3 HTTP check 4, S4 manual step.
4. Name reuse: create "X", Tombstone it, create "X" again. Both succeed; history shows "X (deleted)".
   → S3 HTTP check 5.
5. The dialog mode matches Core's result. The toast follows the returned mode, not the dialog's guess.
   → S4 manual step.

---

## PR S1 + S2 — Core: column, guards, readers, new fields (no behaviour change)

Branch `feat/channel-tombstone-guards` from `origin/develop`. One migration:
`supabase migration new channel_tombstone_guards`.

### Task S1.1: column, CHECK, history helper

- [ ] `ALTER TABLE media_core.channels ADD COLUMN deleted_at timestamptz;` and
  `ADD CONSTRAINT channels_deleted_is_inactive CHECK (deleted_at IS NULL OR status = 'inactive');`
- [ ] `media_core.channel_has_history(p_channel_id uuid) RETURNS boolean`: the exact predicate of the
  phase-1 migration lines 187-191. Phase-1 `media_channel_delete` switches to it, with the same message.
  Grants match the other `media_core` helpers.

### Task S1.2: `channel_lock` refuses a Tombstone (rule 14)

- [ ] Add `OR v_channel.deleted_at IS NOT NULL` to the `NOT FOUND` branch, raising the same
  `not found: channel not found`. Signature unchanged.

### Task S1.3: locks and the deleted message (rules 15, 16)

- [ ] `media_publication_activate`: before the Channel status check, run
  `PERFORM 1 FROM media_core.channels WHERE id IN (<every Channel reached: direct targets + current
  members of targeted Groups>) ORDER BY id FOR SHARE`.
- [ ] Then raise `these channels were deleted — remove them from this Program: <names>` when any of them
  has `deleted_at`, **before** the existing `not active` check.
- [ ] `media_channel_groups_set_members`: `FOR SHARE … ORDER BY id` on the Channels being added, before
  its status check. `media_channel_set_groups`: `FOR SHARE` on its Channel, before its status check.

### Task S2.1: reader verdicts — write them here before any code

- [ ] Fill this table for the 24 functions in ADR rule 13 **and** for every function that passes on a
  Channel id from another table. List those with
  `SELECT proname FROM pg_proc WHERE prosrc ~ '(publication_targets|publication_snapshot_group_members|channel_group_members|playback_logs|channel_device_reservations)'`.
  Each row is "changed: …" or "unchanged because …", using only the reasons in rule 13. Settled already:

| Function | Verdict |
|---|---|
| `channel_lock` | changed (S1.2) |
| `media_publication_activate` | changed (S1.3) |
| `media_channel_groups_set_members`, `media_channel_set_groups` | changed (S1.3) |
| `channel_rows` | changed: filter `deleted_at IS NULL` (list and detail) |
| `media_publication_get` | changed (S2.2) |
| `media_channel_get` | changed (S2.3) |
| `playback_proof_rows` | changed: Channel object gains `deleted` |
| `media_publication_upsert`, `media_publication_duplicate` | unchanged: Publish is the guard (rule 16) |
| `channel_group_rows` | unchanged because a Tombstone is never in a Group (rule 2) |

Filled 2026-11-22 from develop `pg_get_functiondef` (read-only).

| Function | Verdict |
|---|---|
| `channel_set_devices` | unchanged because a Tombstone is always inactive (rule 12): its only read of `channels` is `status = 'active'` |
| `channel_blocking_publication_rows` | unchanged because a Tombstone is never in an Active or Scheduled Program (reads publications only) |
| `playback_proof_rows` | unchanged because it resolves history, where a Tombstone must still resolve (rule 13); its `RETURNS TABLE` stays as it is |
| `media_playback_proof_list` | changed: the `channel` object gains `deleted` = `EXISTS (SELECT 1 FROM media_core.channels c WHERE c.id = r.channel_id AND c.deleted_at IS NOT NULL)` |
| `playback_proof_check_args` | unchanged because it resolves history, where a Tombstone must still resolve (rule 13) |
| `media_playback_proof_export` | unchanged because it resolves history, where a Tombstone must still resolve (rule 13); the CSV name stays unmarked |
| `publication_group_warnings` | unchanged because a Tombstone is never in a Group (rule 2); its direct-target channel ids are only intersected with Group members |
| `media_publication_activate` | changed (S1.3) |
| `now_next_candidates` | unchanged because a Tombstone is never in an Active or Scheduled Program |
| `media_now_next_get` | unchanged because a Tombstone is always inactive (rule 12): every `channels` read has `status = 'active'` |
| `media_calendar_get` | unchanged because a Tombstone is always inactive (rule 12): every `channels` read has `status = 'active'` |
| `media_job_poll`, `media_playback_log` | unchanged because a Tombstone has no reservation: both resolve the Channel through `channel_device_reservations` |
| `player_update_devices_list`, `media_channel_player_candidates` | unchanged because a Tombstone has no reservation: both reach `channels` through `channel_device_reservations` |
| `media_channel_groups_update`, `media_channel_groups_delete` | unchanged because a Tombstone is never in a Group (rule 2) |
| `media_channel_activate`, `media_channel_deactivate`, `media_channel_update` | unchanged because `channel_lock` refuses a Tombstone (rule 14, which names these callers). Not on rule 13's list, but the ADR sanctions it |
| `media_channel_delete` | changed (S1.1): history test moves to `channel_has_history` |
| `media_channel_create` | unchanged because reads no Channel row or name, only ids, counts or existence (rule 13) (it only INSERTs and reads back its own new row; name reuse is S3) |
| `channel_audit` | unchanged because reads no Channel row or name, only ids, counts or existence (rule 13) |
| `media_asset_usage` | unchanged because reads no Channel row or name, only ids, counts or existence (rule 13) |
| `publication_channel_ids`, `media_publish_changes_programs`, `publish_changes_apply` | unchanged because a Tombstone is never in an Active or Scheduled Program (`publish_changes_targets` keeps only those) |
| `media_publications_list` | unchanged because reads no Channel row or name, only ids, counts or existence (rule 13); counts stay as stored (rule 18) |
| `media_channels_list`, `media_channel_groups_get`, `media_channel_groups_list`, `media_channel_groups_create` | unchanged: thin wrappers of `channel_rows` / `channel_group_rows`, which carry the verdict |

- [ ] Stop and report to the owner if any verdict needs a reason that rule 13 does not list.

### Task S2.2: `media_publication_get` target fields (rule 17)

- [ ] Each `target_type = 'channel'` element gains `status` (`ch.status`) and `deleted`
  (`ch.deleted_at IS NOT NULL`). Keep every existing field and the ordering.

### Task S2.3: Channel detail fields (rule 20)

- [ ] `media_channel_get` adds:
  - `draft_programs: [{id, name}]`: the Draft Programs with a `target_type = 'channel'` row for this
    Channel, ordered by name and id, and an empty array when none.
  - `has_history`: from `channel_has_history`.
- [ ] Extend `channels/schema.ts` and its check if the route has a response schema, and the swagger.

### Task S2.4: the rest of the table

- [ ] Apply every "changed" row from S2.1 that the earlier tasks do not cover.

### PR S1 + S2 verification

- [ ] `scripts/migration-guards.sh`, `scripts/db-dry-run.sh`, `npx tsc --noEmit`, `npm run lint` → clean.
- [ ] After merge (CI pushes develop), HTTP against `thundercoredev.vercel.app`. Test rows are prefixed
  `zz-0122b-`. With no Tombstone possible yet:
  1. Publish a Program targeting an inactive Channel → the existing `not active` refusal, unchanged.
  2. GET a Program → Channel targets carry `status` and `deleted: false`.
  3. GET a Channel targeted by a Draft → `draft_programs` lists it, and `has_history: true`.
  4. Set `deleted_at` + `status = 'inactive'` on one `zz-0122b-` Channel **only on develop and only
     after the owner says yes**. Then: Publish names it as deleted; PATCH, Activate and Delete answer
     `not found`; the Channel list omits it; Program GET shows `deleted: true`.
- [ ] Dump `prosrc` of the changed functions from develop and compare with the file (CLAUDE.md §6).
- [ ] Test rows cleanup is R0: list them for the owner, delete only on a yes.

---

## PR S4 — One: notice, labels, error mapping, two-mode dialog (after S1 + S2 are on develop)

Branch `feat/channel-tombstone-ui` from `dev`.

### Task S4.1: types and parsing

- [x] `PublicationTarget` gains optional `status?: string | null` and `deleted?: boolean`.
- [x] `ChannelDetail` gains `draft_programs` (default `[]`) and `has_history` (default `false`).
- [x] The delete result gains an optional `mode: "removed" | "tombstoned"`.
- [x] A contract check covers each new field both present and missing.

### Task S4.2: map the two publish errors

- [x] Map `these channels were deleted` to a new cause `channels-deleted` in `publish-cause.ts`, in Thai like
  `channels-inactive`; the notice text in S4.3 is Thai too. Add a check.

### Task S4.3: target notice and Remove in the wizard and on the edit page

- [x] A pure function returns the problem targets: the `channel` targets whose `deleted` is true, or
  whose `status` is not `active`, with their saved name. Add a check.
- [x] One notice component, modelled on `LayoutNotActiveNotice`. Mount it in `PublicationEditPage.tsx`
  (Draft only), and in `CreatePublicationPage.tsx` on the Channels and Review steps.
- [x] The wizard's Channels step and Review list problem targets under their saved name, with Remove.
  Its rail counts only what it can name, plus the problem targets.

### Task S4.4: `(deleted)` in history

- [x] Program detail target names and Playback Proof Channel names show `<name> (deleted)` with no link
  when `deleted` is true.

### Task S4.5: delete dialog in two modes

- [x] `DeleteChannelDialog` fetches `fetchChannel(id)` when it opens. This covers the row menu, which has
  no blocking list.
- [x] Text:
  - `has_history = false`: the phase-1 text.
  - Otherwise: list the `draft_programs` as "These Draft Programs lose this Channel: …", then "Past
    Programs and Playback Proof keep its name, marked deleted."
  - Both modes end with "This can't be undone."
- [x] The success toast follows the returned `mode`. When `mode` is missing, use the phase-1 toast.

### PR S4 verification (ask the owner before the browser run — CLAUDE.md §3)

`tsc`, `lint`, every `*.check.mts` touched. Browser on develop, using the `zz-0122b-` Tombstone from S1
check 4 if the owner kept it:

- Open the Draft in the wizard and on the edit page → notice, Remove, then Publish works.
- Program detail and Playback Proof → `(deleted)` with no link.
- Delete dialog of a Channel with history → Tombstone text.
- Delete dialog of a Channel with no history → phase-1 text.

Dark mode on the notice and the dialog.

---

## PR S3 — Core: turn the Tombstone on, reuse names (after S4 is on prod)

Branch `feat/channel-tombstone` from `origin/develop`. One migration:
`supabase migration new channel_tombstone`.

- [ ] **Before writing:** find every writer of `media_core.channels` outside Thunder_Core (Aurora-migrate
  and any other repo) and grep for `ON CONFLICT (tenant_id, name)` or `onConflict`. Report any hit to the
  owner before continuing.
- [ ] `media_channel_delete`: keep the lock, the Group refusal and the in-use refusal. Then:
  - `channel_has_history` false → hard delete exactly as in phase 1.
  - `channel_has_history` true → in one statement set `deleted_at = now()` and `status = 'inactive'`;
    delete its `channel_device_reservations` and `channel_devices` rows; audit `channel_delete`.
  - Return `{id, deleted: true, mode}`.
- [ ] `ALTER TABLE media_core.channels DROP CONSTRAINT channels_tenant_id_name_key;` then
  `CREATE UNIQUE INDEX channels_tenant_id_name_live_key ON media_core.channels (tenant_id, name) WHERE
  deleted_at IS NULL;`
- [ ] Rollback file: restore the constraint (fails if a name was reused — say so in the file) and the
  phase-1 function.

### PR S3 verification

- [ ] Guards, dry run, `tsc`, `lint` → clean.
- [ ] HTTP on develop with `zz-0122b-` rows:
  1. Delete a never-used Channel → `mode: removed`.
  2. Delete a Channel a Cancelled Program targets → `mode: tombstoned`; its Player shows free in
     `player-candidates`.
  3. Publish a Draft that targets it → the deleted refusal.
  4. Duplicate an Ended Program on it → the new Draft's GET shows the target with `deleted: true`.
  5. Create a Channel with the deleted one's name → success.
- [ ] Prod push is R0. List the migration and the constraint change for the owner first.

## Not in this plan

- Swapping a Player under a live Program (deferred issue, ADR 0122 options).
- A view of deleted Channels or an undo (ADR 0122 rule 19).
- Deleting the 68 history-free Channels on prod — an owner task, available since phase 1.
