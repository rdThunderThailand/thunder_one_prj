# 0033 — Channel lifecycle is `Draft → Active ↔ Inactive`, retirement is one-way, concurrency reuses ADR 0003

Part of the Channel set: 0030 (membership and exclusivity), this ADR, 0034 (configuration boundary
and target snapshot), 0035 (monitoring, alerts, notifications).

## Context

Verified against `ThunderCore` (`sfiefevtxalqjizdkcsw`) on 2026-08-19/20:

- `channels_status_check` accepts **`active` and `inactive` only**. There is no `draft` value and
  no column recording whether a Channel has ever been activated.
- Both live channels are `active`. Both hold `channel_devices` rows (6 across the two).
- `media_core.channels` has no `revision` / `version` / `lock` column, and no `%channel%` RPC exists
  to add a parameter to.

ADR 0003 already solved the same concurrency problem for publication drafts and its solution is
load-bearing in a non-obvious way: the conflict message must begin with `Already ` because
`Thunder_Core/src/lib/core/media.ts:29`'s `EXPECTED_ERROR` regex is what decides whether a plpgsql
`RAISE` reaches the client as a 409 or is swallowed into `'Media operation failed'` → 500. The
frontend's `classifyApiError` then narrows on the *message*, not on the status code.

ADR 0025 established this project's shape for destructive guards: `media_playlist_delete` counts
referencing publications and refuses rather than cascading.

## Decision

### Three states, one irreversible edge

```
Draft ──activate──▶ Active ◀──activate──┐
                      │                 │
                      └──deactivate────▶ Inactive
```

`Draft → Active` is one-way. Nothing returns a Channel to `Draft`. `Active ↔ Inactive` is freely
reversible, because deactivation is an operational pause, not a deletion.

**Deactivation is blocked while any Active or Scheduled Publication targets the Channel** — the same
guard, with the same error shape, that ADR 0034 puts on removing a Media Device. Deactivating
releases the Channel's device reservations; if a running Publication is still driving those screens
through its frozen target snapshot, releasing them lets another Channel reserve the same device and
produces exactly the double-playback state the reservation exists to prevent. The refusal lists the
blocking Publications so the operator can Cancel them or wait for them to End.

`channels_status_check` is rewritten to `('draft','active','inactive')`, and **the column default
changes from `'active'` to `'draft'`**. Changing a default never rewrites existing rows, so the two
production rows keep `active` either way — the reason to change it is that `DEFAULT 'active'` means
any insert that omits `status` creates a live Channel that skipped activation validation and has no
device reservations. The safe state has to be the one you get by saying nothing.

### `activated_at` is the retirement evidence

`activated_at timestamptz` is set on the **first** activation and never cleared — not on
deactivation, not on re-activation. It is not "when did this last go live"; it is "has this Channel
ever been real". The two existing `active` rows are backfilled with their `created_at` during the
migration, because a Channel that is active now has self-evidently been activated.

A Channel may be **hard-deleted** only when all three hold:

1. `activated_at IS NULL` — it has never been Active.
2. No Publication Target references it (present or historical).
3. No other domain reference exists — no reservation, no incident, no audit subject requiring the
   row to resolve.

Anything else **deactivates instead**. This keeps Publication history, monitoring history and the
audit trail resolvable: a deleted Channel row would turn every historical reference into a dangling
id, and `publication_targets` is exactly the frozen snapshot ADR 0034 refuses to rewrite.

### Activation is one transaction

Activation validation, reservation insert, status transition, `activated_at` stamp, `revision` bump
and the audit record are a **single database transaction**. Partial activation is the failure mode
this rule exists to prevent: a Channel marked `active` whose device reservations did not land is a
Channel that will accept Publications and silently fight another Channel for the same screen.

Activation requires: a name, a Channel Category, a Channel Type, and at least one Media Device.
Location and Default Playlist stay optional. Every assigned Media Device must be free of another
Channel's reservation; the conflict names the holder (ADR 0030).

### Migration preserves, never repairs

The migration that introduces reservations runs a **preflight** first. If any Media Device is
already a member of more than one Channel that would become `active`, the migration **fails with a
report listing every conflicting `(media_device_id, channel_id)` pair**. It does not pick a winner,
does not deactivate a Channel, and does not delete a membership row.

Data conflicts are business decisions. A migration that silently resolves one has made that decision
on behalf of an operator who will discover it when a screen stops playing.

### Concurrency reuses ADR 0003 exactly

- `media_core.channels.revision integer NOT NULL DEFAULT 1` — `integer`, matching ADR 0003, not
  `bigint`. A row that needs more than two billion edits has a different problem.
- The write RPC takes `p_expected_revision integer` and rejects a mismatch.
- The rejection message is **`'Already modified: channel was changed elsewhere'`**. The `Already `
  prefix is mandatory: without it the error is a 500, not a 409 (see Context).
- Every RPC that writes the Channel row bumps `revision`; only the primary write checks it — the
  same "check on the first write, bump on all" scope ADR 0003 argued for.
- The conflict UI is ADR 0003's two-action banner: **โหลดใหม่** (re-fetch, discard local edits) and
  **บันทึกทับ** (re-read `revision`, resend). No merge UI.
- **Deliberate overwrite is its own audited mutation**, distinguishable in the audit log from a
  clean save. "The operator chose to overwrite someone else's change" is the fact worth keeping.

If any RPC signature changes after first release, the migration **drops the exact old signature
before `CREATE OR REPLACE`**, or keeps a wrapper at the old signature. `CREATE OR REPLACE FUNCTION`
with an added parameter creates an overload instead of replacing, and every existing call becomes
ambiguous at once.

## Rejected alternatives

**Allow `Active → Draft` so a mis-configured Channel can be "unpublished" and reworked.** Rejected:
Publications, reservations and incidents all attach to an Active Channel, and there is no coherent
answer for what happens to them when it becomes a Draft again. Deactivate does the same job with
history intact.

**Derive lifecycle instead of storing it, the way ADR 0004 derives publication status and ADR 0028
derives playlist status.** Tempting for consistency, and genuinely correct for those two. Rejected
here because there is no underlying fact to derive from: a Channel's state is exactly the operator
action taken on it. Deriving "Active" from "has ≥1 reservation" would make deactivation impossible
to express without deleting the reservations that record why the device is held.

**A boolean `has_been_active` instead of `activated_at`.** One byte, same guard. Rejected: the
timestamp answers the guard *and* the "when did this go live" question the monitoring history needs
anyway, at no extra cost.

**Reuse `updated_at` as the concurrency token.** Already rejected by ADR 0003 for publications (two
writes in the same `now()` are indistinguishable, and the bump has to be added to every RPC anyway).
Re-deciding it differently for Channels would give the codebase two concurrency idioms.

**`revision bigint`.** Proposed in review. Rejected for consistency with ADR 0003's `integer` — a
second numeric type for the same concept is a papercut every time a signature is written.

**Let the migration auto-resolve membership conflicts by keeping the oldest Channel.** Fastest path
to a green migration. Rejected outright: it silently stops playback on whichever screen loses, and
the operator has no record of the choice. Fail with a report; a human picks.

**Let deactivation release reservations immediately while running Publications keep playing.** This
ADR's first draft said exactly that, and it was wrong: it is the one path that lets two Channels
reserve one screen, because the released device becomes reservable while it is still receiving the
old Channel's frozen-snapshot content. Blocking deactivation closes it with a rule that already
exists for device removal, instead of adding a second one.

**Allow deactivation but keep the reservations until the last Publication ends.** Preserves the
"pause" semantics and still prevents double playback. Rejected: it needs a background job to notice
the last Publication ending and release the rows, so the exclusivity guarantee would depend on a
worker running rather than on a transaction — and an Inactive Channel holding live reservations is
a state no screen in the UI can explain.

**Soft-delete every Channel (`deleted_at`) instead of the never-Active hard-delete carve-out.**
Rejected for the same reason ADR 0025 rejected it for playlists: nothing needs recovery of a Channel
that was never real, and a soft-deleted row still has to be filtered out of every list, count and
name-uniqueness check forever.

## Consequences

- `channels_tenant_id_name_key` now spans Drafts too, so a Draft occupies its name. That is
  intended — two operators staging the same Channel name is the collision the constraint exists for.
- The list page's lifecycle counts (`Draft` / `Active` / `Inactive`) are counts of a stored column,
  unlike the playlist list's derived status (ADR 0028). They cannot silently read zero.
- Deactivating a Channel releases its reservations and frees those Media Devices for another
  Channel's activation. Because deactivation is blocked while an Active or Scheduled Publication
  targets the Channel, the released devices are never still playing that Channel's content. Cutting
  a Channel over therefore has a defined order: cancel or wait out the Publications, deactivate,
  then activate the replacement.
- Every Channel write RPC gains a `p_expected_revision` parameter from day one. Adding it later is
  the signature change that forces the `DROP FUNCTION` dance above.
- The preflight can block the migration. That is a deployment step with a human in it, not a
  pipeline that runs unattended.
