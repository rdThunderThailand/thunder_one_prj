# Plan: Channels & Monitoring

Execution detail for ADR 0030 (membership and exclusivity), 0033 (lifecycle and concurrency), 0034
(display expectation and target snapshot) and 0035 (monitoring, alerts, remote operations). The
ADRs hold the decisions and the rejected alternatives; this file holds everything that would rot
inside one.

Nothing here has been implemented. No application code, no Thunder_Core change and no migration has
been run.

---

## 1. Production evidence snapshot

Queried directly against `ThunderCore` (`sfiefevtxalqjizdkcsw`) on **2026-08-19/20**. Re-verify
before writing migrations — this is a snapshot, not a contract.

### media_core

| object | state |
| --- | --- |
| `media_core.channels` | `id, tenant_id, name, status, metadata jsonb, created_at, updated_at, channel_type, location_id, estimated_daily_impressions` |
| `channels_status_check` | `CHECK (status IN ('active','inactive'))` — **no `draft`** |
| `channels_channel_type_check` | `CHECK (channel_type IN ('dooh','in_store','website','social','email','mobile_app'))` |
| `channels_tenant_id_name_key` | `UNIQUE (tenant_id, name)` |
| `channels_location_id_fkey` | `FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL` |
| `media_core.channel_devices` | `(channel_id, device_id, role, created_at)`, PK `(channel_id, device_id)`, **no `tenant_id`** |
| `channel_devices_role_check` | `CHECK (role IN ('primary','backup'))`, column is `NOT NULL DEFAULT 'primary'` |
| `channel_devices_device_id_fkey` | `FOREIGN KEY (device_id) REFERENCES **assets(id)** ON DELETE CASCADE` |
| RPCs | **no function matching `%channel%` exists** — Channel API is greenfield |

Live rows: **2 channels** (both `active`, both `dooh`, both `location_id IS NULL`), **6
channel_devices** (all `role = 'primary'`).

### Alerting

| object | state |
| --- | --- |
| `public.alert_rules` | `tenant_id, name, description, asset_category, target_attribute (default `'health_score'`), operator (default `'LT'`), threshold, severity (default `'WARNING'`), is_enabled, event_code` — **0 rows** |
| `public.alert_incidents` | `id, tenant_id, rule_id, asset_id, triggered_value, severity, status, message, acknowledged_at/by_id, resolved_at/by_id, created_at, updated_at, event_code` — **56 rows** |
| incident data | 100% `event_code = 'device_offline'`, 100% `rule_id IS NULL`, statuses `OPEN` / `RESOLVED` (uppercase) |
| `alert_incidents_has_cause` | `CHECK (rule_id IS NOT NULL OR event_code IS NOT NULL)` |
| `public.media_sweep_device_offline()` | zero-arg; opens on `now() - last_heartbeat_at > interval '5 minutes'`; dedupes with `NOT EXISTS (… status = 'OPEN')`; resolves on `<= interval '5 minutes'` in a single observation |
| `cron.job` | `media-sweep-device-offline \| */5 * * * * \| SELECT public.media_sweep_device_offline();` |

### Notification scaffolding — 8 tables, all 0 rows

| table | columns that matter |
| --- | --- |
| `notification_event_types` | `code, name, category, severity_default, **entity_type**, is_active` |
| `notification_rules` | `event_type_id, severity_override, condition_json, **recipient_strategy**, **recipient_config_json**, **channel_policy_json**, **dedup_window_seconds**, **cooldown_seconds**, priority_order` |
| `notification_preferences` | `user_id, event_type_id, channel_code, is_enabled, **mute_until**, **quiet_hours_start/end**, timezone |
| `notification_inbox` | `user_id, event_type_id, severity, title, message, deeplink_url, **entity_type**, **entity_id**, is_read/archived/pinned, expires_at — **no `channel_code`** |
| `notification_providers` | `channel_code, provider_name, config_json, status, is_default, last_tested_at` |
| `notification_channels` | `code, name, is_active` |
| `notification_templates` | `event_type_id, channel_code, language_code, subject_template, body_template` |
| `notification_action_logs` | `user_id, notification_inbox_id, action_type, action_value, action_at` |

**Gap:** no table records a per-delivery attempt. See §7.

### Telemetry, commands, screenshots

`public.device_telemetry_latest` (`device_id, payload, recorded_at`) is the **only** table of the
four this feature needs. There is no telemetry history, no screenshot table and no command table —
verified by scanning `information_schema.tables` for `telemetry|screenshot|command|uptime`. See §7a.

### Frontend

| location | state |
| --- | --- |
| `src/types/domain.ts:4` | `ChannelType = "dooh"｜"in_store"｜"online"｜"social"｜"other"` — **zero consumers** |
| `src/types/domain.ts:5` | `ChannelOnlineStatus = "online"｜"warning"｜"offline"` |
| `src/features/publications/channels-logic.ts:5-8` | device thresholds: >2 min `warning`, >5 min `offline` |
| `src/app/(dashboard)/channels/page.tsx` | placeholder route, `<h1>Channels</h1>` |
| `src/features/channels/` | empty scaffold (`components/`, `hooks/`, `services/`, `types/`) |

---

## 2. Migration sequence

Each step is independently deployable and safe to stop after. Steps marked **PREFLIGHT** can fail
by design and require a human decision before proceeding.

| # | change | notes |
| --- | --- | --- |
| 1 | `channels.revision integer NOT NULL DEFAULT 1` | ADR 0033; matches ADR 0003's type |
| 2 | `channels.activated_at timestamptz NULL`; backfill `= created_at` for the 2 existing `active` rows | ADR 0033 |
| 3 | rewrite `channels_status_check` → `('draft','active','inactive')` **and** `ALTER COLUMN status SET DEFAULT 'draft'` | current default is `'active'`; an insert that omits `status` must not create a live Channel |
| 4 | **PREFLIGHT** category audit: any row on `website` / `email` / `mobile_app` | §3 |
| 5 | **expand** `channels_channel_type_check` to allow `online` alongside the existing six | must precede the data update — the current CHECK rejects `online` |
| 6 | data migration `website → online` | zero rows today, so this is a no-op that must still run in order |
| 7 | **narrow** the CHECK to `('dooh','in_store','online','social')`, then `RENAME COLUMN channel_type TO channel_category` | ADR 0030; the column has always held Category values |
| 8 | `media_core.channel_types` reference table + seed; `channels.channel_type_id uuid NULL REFERENCES channel_types(id)` | ADR 0030 — Type is a table, not a CHECK |
| 9 | Channel Display Expectation columns + CHECKs | §4a |
| 10 | `channels.default_playlist_id uuid NULL REFERENCES media_core.playlists(id) ON DELETE SET NULL` | ADR 0034; `SET NULL` so a prefill pointer never blocks ADR 0025's delete guard |
| 11 | `media_core.monitoring_policy_defaults` (per tenant) + nullable override columns on `channels` | §4b |
| 12 | **PREFLIGHT** duplicate active membership | §2 preflight queries |
| 13 | `channel_device_reservations` (**`ON DELETE RESTRICT`** to `assets`); populate from currently-active channels | §4 |
| 14 | `COMMENT ON COLUMN channel_devices.role` → deprecated; **do not drop** | ADR 0030 |
| 15 | `alert_incidents.recovery_observed_at timestamptz NULL` + policy snapshot columns | ADR 0035 |
| 16 | **PREFLIGHT** duplicate active incidents | §2 preflight queries |
| 17 | partial unique index on `alert_incidents` | §6 |
| 18 | rewrite `media_sweep_device_offline()` body — signature unchanged | §6 |
| 19 | `notification_deliveries` | §7 |
| 20 | `device_telemetry_history` | §7a — `device_telemetry_latest` keeps only the hot row |
| 21 | `media_device_commands` | §7a |
| 22 | `media_device_screenshots` | §7a |
| 23 | Channel CRUD / activation / assignment / deactivation RPCs | greenfield, no `DROP FUNCTION` needed on first create |
| 24 | monitoring read-model RPCs (uptime, history) | derived from §7a + `alert_incidents` — **no new table** |
| 25 | retention worker | §10 — separate approval before any production run |
| 26 | **PREFLIGHT** consumer sweep, then `ALTER TABLE channel_devices DROP COLUMN role` | §12 |

### Preflight queries

```sql
-- Step 4: any channel on a category being removed or renamed
SELECT id, tenant_id, name, channel_type
FROM   media_core.channels
WHERE  channel_type IN ('website','email','mobile_app');
-- website → handled by steps 5-7; email/mobile_app → STOP, manual review

-- Step 13: any media device that would be reserved by more than one active channel
SELECT cd.device_id, array_agg(c.id) AS channel_ids, array_agg(c.name) AS channel_names
FROM   media_core.channel_devices cd
JOIN   media_core.channels c ON c.id = cd.channel_id
WHERE  c.status = 'active'
GROUP  BY cd.device_id
HAVING count(*) > 1;
-- any row → migration FAILS with this report. Do not pick a winner. (ADR 0033)

-- Step 13b: cross-tenant membership (ADR 0007 records that channel_devices can cross tenants)
SELECT cd.channel_id, cd.device_id, c.tenant_id AS channel_tenant, a.tenant_id AS asset_tenant
FROM   media_core.channel_devices cd
JOIN   media_core.channels c ON c.id = cd.channel_id
JOIN   public.assets a       ON a.id = cd.device_id
WHERE  c.tenant_id IS DISTINCT FROM a.tenant_id;

-- Step 16: duplicate active incidents that would break the unique index
SELECT asset_id, event_code, count(*)
FROM   public.alert_incidents
WHERE  status IN ('OPEN','ACKNOWLEDGED')
GROUP  BY asset_id, event_code
HAVING count(*) > 1;
-- any row → STOP and report. Do not delete rows to make the index build. (ADR 0035)
```

Every `CREATE OR REPLACE FUNCTION` that changes a signature must be preceded by
`DROP FUNCTION IF EXISTS <exact old signature>`. Adding a parameter creates an overload; existing
calls then fail as ambiguous. `media_sweep_device_offline()` deliberately keeps its zero-arg
signature so step 13 is a body-only replacement.

---

## 3. Category migration

| current DB value | action |
| --- | --- |
| `dooh` | keep |
| `in_store` | keep |
| `website` | **rename to `online`** — 0 rows today, so free |
| `social` | keep |
| `email` | remove from CHECK; any row → manual review |
| `mobile_app` | remove from CHECK; any row → manual review |

Frontend: `ChannelType` in `src/types/domain.ts:4` drops `"other"` and renames nothing else (its
`"online"` already matches the target). Zero consumers, so this is a type-only edit.

**Column naming.** `channels.channel_type` has always held Category values. It is renamed to
`channel_category` in step 7, after the CHECK is narrowed. Nothing outside the migration reads the
old name: no `%channel%` RPC exists and `ChannelType` in the frontend has no consumers.

**Channel Type is a reference table**, added in step 8:

```sql
CREATE TABLE media_core.channel_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NULL,              -- NULL = platform-wide seed row
  channel_category varchar NOT NULL,       -- which Category this Type belongs to
  code             varchar NOT NULL,
  name             varchar NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  CHECK (channel_category IN ('dooh','in_store','online','social')),
  UNIQUE NULLS NOT DISTINCT (tenant_id, code)
);
```

**`NULLS NOT DISTINCT` is required, not stylistic.** A plain `UNIQUE (tenant_id, code)` treats every
`NULL` tenant as distinct, so the platform seed rows — the whole reason the column is nullable —
could be inserted twice over. The server is PostgreSQL 17.6, so the modifier is available; on an
older server the equivalent is a pair of partial unique indexes
(`WHERE tenant_id IS NULL` / `WHERE tenant_id IS NOT NULL`).

**Validation on `channels.channel_type_id`, enforced in the RPC** (a cross-row rule a FK cannot
express):

- the Type's `channel_category` must equal the Channel's `channel_category`;
- the Type's `tenant_id` must be `NULL` (platform seed) or equal the Channel's `tenant_id`;
- the Type must be `is_active`, checked at write time only — deactivating a Type must not
  retroactively invalidate Channels already using it.

Seed set for launch (`channel_category = 'dooh'` unless noted): `led_display`, `lcd_screen`,
`video_wall`, `kiosk`, and `menu_board` (`in_store`). **This seed list is the one item still open to
product** — it is the launch vocabulary, not a constraint, so adding to it later is an insert rather
than a migration. `channels.channel_type_id` is nullable in step 8 and becomes required at
activation (ADR 0033), so the two existing rows do not need backfilling before the column exists.

---

## 4. Active Reservation

```sql
CREATE TABLE media_core.channel_device_reservations (
  tenant_id        uuid NOT NULL,
  channel_id       uuid NOT NULL REFERENCES media_core.channels(id) ON DELETE CASCADE,
  media_device_id  uuid NOT NULL UNIQUE REFERENCES public.assets(id) ON DELETE RESTRICT,
  reserved_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, media_device_id)
);
```

- `media_device_id UNIQUE` **is** the exclusivity rule — a race between two concurrent activations
  loses at the index, not at a `SELECT`.
- `tenant_id` is carried even though the unique key does not need it, because isolation is enforced
  in the RPC layer, not RLS (ADR 0007). The activation RPC asserts
  `channels.tenant_id = reservation.tenant_id = assets.tenant_id` before inserting.
- Written and deleted only inside the activation / deactivation transaction (ADR 0033).
- The conflict response carries the holding `channel_id` **and** `name`, because the UI has to say
  which Channel is holding the device.
- **`ON DELETE RESTRICT`, not `CASCADE`.** A cascade would let deleting an `assets` row silently
  remove the reservation, leaving an Active Channel that no longer holds the device exclusively —
  the one state this table exists to make impossible.

### Pre-existing hole: `channel_devices_device_id_fkey` is `ON DELETE CASCADE`

Deleting an asset already silently removes its Channel membership today, before any of this work.
`RESTRICT` on the reservation blocks the delete for *reserved* devices, but a device that is only a
Draft member is still cascaded away without a trace. The full fix is a Media Device deletion guard
that refuses when the device has any Channel membership, any reservation, or any Publication target
— the shape ADR 0025 established for playlists. Scheduled with the Device management work, not with
Channels; recorded here so it is not rediscovered as a bug.

---

## 4a. Channel Display Expectation columns

Typed columns, not jsonb — these are compared numerically on every assignment (ADR 0034).

```sql
ALTER TABLE media_core.channels
  ADD COLUMN expected_orientation varchar NULL
    CHECK (expected_orientation IN ('landscape','portrait')),
  ADD COLUMN expected_resolution  varchar NULL;   -- '1920x1080', same vocabulary as ADR 0032
```

Both nullable. `NULL` means "unknown" and performs **no** check — not "matches everything". The
resolution vocabulary is the one already pinned in `src/features/playlists/output-profile.ts`
(`1920x1080`, `1080x1920`, `3840x2160`, `1280x720`); orientation is derived from it on write rather
than typed twice, but stored separately because it is the field that blocks.

## 4b. Monitoring policy storage

Sparse overrides as **nullable typed columns**, where `NULL` means inherit. Same three keys at both
levels; the resolver walks System Default → Organization → Channel and returns the value plus the
level it came from.

```sql
CREATE TABLE media_core.monitoring_policy_defaults (
  tenant_id                   uuid PRIMARY KEY,
  offline_threshold_minutes   integer NULL CHECK (offline_threshold_minutes >= 5),
  screenshot_interval_minutes integer NULL,
  storage_warning_percent     integer NULL CHECK (storage_warning_percent BETWEEN 1 AND 99),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_core.channels
  ADD COLUMN offline_threshold_minutes   integer NULL CHECK (offline_threshold_minutes >= 5),
  ADD COLUMN screenshot_interval_minutes integer NULL,
  ADD COLUMN storage_warning_percent     integer NULL CHECK (storage_warning_percent BETWEEN 1 AND 99);
```

`>= 5` is enforced in the constraint, not just documented: the cron runs every 5 minutes (§6), so a
smaller threshold is a value the system cannot honour. System defaults are constants in the resolver
— a fourth storage level for three numbers nobody edits is not worth a table.

## 5. Field / API / error matrix

| operation | capability | key errors |
| --- | --- | --- |
| list / detail | `media.channels.read` | — |
| create | `media.channels.manage` | `Invalid input:` (name, category, type), `Already exists:` (name unique per tenant) |
| edit | `media.channels.manage` | `Already modified: channel was changed elsewhere` → **409** |
| delete Draft | `media.channels.manage` | `Already in use:` + blocking references; refused when `activated_at IS NOT NULL` |
| activate | `media.channels.activate` | `Invalid input:` (missing name/category/type/device), `Already in use:` + holding channel |
| deactivate | `media.channels.activate` | `Already in use:` + list of Active/Scheduled Publications — blocked while any targets the Channel (ADR 0033) |
| assign device | `media.devices.assign` | `Invalid input:` orientation mismatch (**block**); resolution mismatch needs `p_confirm_mismatch` |
| remove device | `media.devices.assign` | `Already in use:` + list of Active/Scheduled Publications |
| acknowledge incident | `media.monitoring.incidents.manage` | — |

**Error prefix contract (ADR 0003, non-negotiable):** `Thunder_Core/src/lib/core/media.ts:29`'s
`EXPECTED_ERROR = /^(Invalid input:|not found:|Unauthorized|Permission denied|Already )/` decides
whether a `RAISE` reaches the client at all. Anything outside that set becomes
`'Media operation failed'` → 500. `Conflict:` is **not** in the set. Every guard message above starts
with an accepted prefix, and `classifyApiError` narrows on the message, not the status code.

---

## 6. Sweep changes

Body-only rewrite of `public.media_sweep_device_offline()`. Signature and `cron.job` entry unchanged.

1. Threshold comes from the effective policy per device (`System Default → Organization → Channel`),
   replacing the literal `interval '5 minutes'`.
2. Dedupe: `status IN ('OPEN','ACKNOWLEDGED')`, backed by
   `UNIQUE (asset_id, event_code) WHERE status IN ('OPEN','ACKNOWLEDGED')`.
3. Auto-resolve: also `status IN ('OPEN','ACKNOWLEDGED')`. **This is the bug fix** — the current
   clause is `WHERE i.status = 'OPEN'`, so introducing `ACKNOWLEDGED` without this change strands
   every acknowledged incident open forever.
4. Two-observation recovery: first healthy sweep stamps `recovery_observed_at`; the next healthy
   sweep resolves; an offline reading clears the stamp.
5. Incident records the effective policy and its version at open time.

**Cadence ceiling.** `*/5` cron + 5-minute default threshold ⇒ recovery lands 5–10 minutes after the
device returns, and **a policy threshold below 5 minutes has no effect**. Lowering it requires
changing the cron entry in the same change. State this in the policy UI next to the threshold field.

---

## 7. Alert / notification event mapping

| concept | table | notes |
| --- | --- | --- |
| incident | `alert_incidents` | existing; `OPEN` / `ACKNOWLEDGED` / `RESOLVED` uppercase |
| what fired it | `alert_rules` | effective-policy resolver reads it; sweep stops hard-coding |
| event definition | `notification_event_types` | one row, `entity_type = 'alert_incident'` |
| who gets told | `notification_rules` | `recipient_strategy` + `recipient_config_json` (User / Team); `cooldown_seconds` for reminder flooding |
| per-user opt-out | `notification_preferences` | `channel_code`, `mute_until`, quiet hours |
| in-app delivery | `notification_inbox` | `entity_type='alert_incident'`, `entity_id=<incident_id>`, `deeplink_url` → Channel monitoring |
| email rendering | `notification_templates` | `channel_code='email'` |
| provider config | `notification_providers` | `status`, `last_tested_at` |
| **delivery attempt** | **`notification_deliveries` (new)** | **does not exist — see below** |

### `notification_deliveries` — the one new table

Nothing in the eight tables records the outcome of a single send. `notification_inbox` is the in-app
payload and has no `channel_code`; `notification_action_logs` records user actions;
`notification_providers.status` is provider-level. Needs at minimum:

```sql
CREATE TABLE public.notification_deliveries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  incident_id       uuid NOT NULL REFERENCES public.alert_incidents(id) ON DELETE CASCADE,
  event_type_id     uuid NOT NULL REFERENCES public.notification_event_types(id) ON DELETE RESTRICT,
  event_phase       varchar NOT NULL CHECK (event_phase IN ('open','reminder','resolved')),
  phase_seq         integer NOT NULL DEFAULT 0,   -- reminder 1, 2, 3…; 0 for open/resolved
  recipient_user_id uuid NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  channel_code      varchar NOT NULL REFERENCES public.notification_channels(code) ON DELETE RESTRICT,
  status            varchar NOT NULL
                      CHECK (status IN ('SENT','FAILED','UNCONFIGURED','NO_RECIPIENT')),
  pierced_quiet_hours boolean NOT NULL DEFAULT false,
  error             text NULL,
  attempted_at      timestamptz NOT NULL DEFAULT now(),

  -- the recipient column and the status must agree
  CONSTRAINT notification_deliveries_recipient_matches_status CHECK (
    (status =  'NO_RECIPIENT' AND recipient_user_id IS NULL) OR
    (status <> 'NO_RECIPIENT' AND recipient_user_id IS NOT NULL)
  ),
  CHECK (phase_seq >= 0),
  CHECK ((event_phase = 'reminder') = (phase_seq > 0))
);

-- idempotency for a real recipient
CREATE UNIQUE INDEX notification_deliveries_idem
  ON public.notification_deliveries
     (incident_id, event_type_id, event_phase, phase_seq, recipient_user_id, channel_code)
  WHERE recipient_user_id IS NOT NULL;

-- idempotency for "nobody to notify" — one row per phase, not one per retry
CREATE UNIQUE INDEX notification_deliveries_idem_norecipient
  ON public.notification_deliveries
     (incident_id, event_type_id, event_phase, phase_seq, channel_code)
  WHERE recipient_user_id IS NULL;
```

Two indexes, not one, for a specific reason: **PostgreSQL treats NULLs as distinct in a unique
index**, so a single key containing `recipient_user_id` would let every retry of a `NO_RECIPIENT`
attempt insert another row. The partial pair covers both cases without a sentinel UUID.

`event_phase` is in the key because one incident legitimately produces several notifications to the
same person on the same channel — open, reminders, resolution. Without it the resolution
notification collides with the open notification and is silently dropped.

`recipient_user_id` is `ON DELETE RESTRICT`, not `SET NULL`: nulling it on user deletion would
produce a `SENT` row with no recipient and violate the status/recipient CHECK. A delivery record is
history — deleting the user does not un-send the email.

### Quiet hours and mute — decided

`mute_until` and `quiet_hours_start/end` can silence a `device_offline` alert as effectively as an
unconfigured provider can. **High-severity alerts pierce quiet hours and `mute_until`; everything
else obeys them.** The pierce is recorded on the delivery row (`pierced_quiet_hours`), so a
notification that arrived at 3am has a reason attached rather than looking like a bug in the
preference system.

`device_offline` qualifies: a screen that is dark is dark all night, and an operator who chose to be
notified about outages did not choose to be notified about them eight hours late. Reminders inside
the cooldown do **not** pierce — only the opening notification and the resolution.

---

## 7a. Persistence for history, commands and screenshots

The earlier claim that this feature needs "only two new tables" was wrong. `public.device_telemetry_latest`
(`device_id, payload, recorded_at`) is the **only** telemetry storage that exists — there is no
history table, no screenshot table and no command table anywhere in the database. 14.1's History and
14.3's Remote Operations both depend on storage that has to be created.

```sql
-- 14.1: the 90-day series behind uptime, storage trend and History
CREATE TABLE public.device_telemetry_history (
  device_id   uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  payload     jsonb NOT NULL,
  PRIMARY KEY (device_id, recorded_at)
);
-- device_telemetry_latest stays as the hot single row; history is append-only.
-- Retention 90 days (§10). Partition or BRIN on recorded_at when volume justifies it — not now.

-- 14.3: one row per issued command, immutable command_id
CREATE TABLE media_core.media_device_commands (
  command_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id      uuid NOT NULL,          -- one fan-out = one operation_id across its per-device rows
  tenant_id         uuid NOT NULL,
  channel_id        uuid NULL REFERENCES media_core.channels(id) ON DELETE SET NULL,
  media_device_id   uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  kind              varchar NOT NULL CHECK (kind IN ('capture','restart')),
  status            varchar NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','accepted','running','completed','failed','expired','timed_out')),
  issued_by         uuid NOT NULL,
  reason            text NULL,              -- mandatory for restart, enforced in the RPC
  issued_at         timestamptz NOT NULL DEFAULT now(),
  ttl_expires_at    timestamptz NOT NULL,   -- acceptance deadline
  accepted_at       timestamptz NULL,
  execution_deadline timestamptz NULL,      -- set on accept, separate from TTL
  completed_at      timestamptz NULL,
  result            jsonb NULL
);
CREATE INDEX ON media_core.media_device_commands (media_device_id, status);
CREATE INDEX ON media_core.media_device_commands (operation_id);

-- 14.3: screenshot metadata; bytes live in Storage
CREATE TABLE media_core.media_device_screenshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  media_device_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  command_id      uuid NULL REFERENCES media_core.media_device_commands(command_id) ON DELETE SET NULL,
  storage_path    text NOT NULL,
  captured_at     timestamptz NOT NULL,
  bytes           bigint NULL,
  content_type    varchar NULL
);
-- Retention 30 days, and the Storage object is deleted with the row (§10).
```

**Uptime and History are a read model, not a table.** They are computed from
`device_telemetry_history` plus `alert_incidents` in an RPC. A materialised summary is the upgrade
path if the query gets slow; storing a rollup now would be a second copy of numbers that already
exist, going stale on the same 5-minute cadence.

**Total new tables:** `channel_device_reservations`, `channel_types`,
`monitoring_policy_defaults`, `notification_deliveries`, `device_telemetry_history`,
`media_device_commands`, `media_device_screenshots` — **seven**, of which three (`commands`,
`screenshots`, and the Player half of telemetry history) are gated on Player support that is not
verified (§12).

## 8. Command protocol and state machine

```
Queued ──(player polls within TTL)──▶ Accepted ──▶ Running ──▶ Completed
   │                                                   │
   └──(TTL elapsed, never polled)──▶ Expired           └──▶ Failed
                                                       └──(execution timeout)──▶ Timed out
```

- `command_id` is immutable and issued once. The Player executes a given `command_id` **at most
  once**; re-polling returns the existing result.
- **TTL bounds acceptance only.** Execution has a separate timeout. A command that is running has
  not expired.
- Commands are queued, never refused on a liveness reading — liveness is up to 5 minutes stale
  (§6), so refusing on it would reject commands to devices that are up.
- **A fan-out is one `operation_id` across N per-device rows.** One click on Capture Now against a
  three-screen Channel issues one `operation_id` and three `command_id`s. Without that column the
  rollup would have to be guessed from `(channel_id, kind, issued_at)`, which mixes in any other
  operator's command issued in the same window.
- Fan-out across a Channel's members reports **`Partial`** when outcomes differ. `Partial` is
  **derived per `operation_id`**, never stored: all rows `completed` → `Completed`; all
  `failed`/`expired`/`timed_out` → `Failed`; any row still `queued`/`accepted`/`running` → `Running`;
  otherwise `Partial`. A stored rollup would go stale on every per-device transition.
- Channel-level commands are available on **Active Channels only**.

| command | TTL (accept) | execution timeout | success condition |
| --- | --- | --- | --- |
| Capture Now | 2 min | per-command | screenshot uploaded to the scoped signed target |
| Manual Restart | 5 min | per-command | Player reports `Completed` **after** coming back up |

Manual Restart requires a confirmation listing every affected Media Device and a mandatory reason.
No second-approver workflow. Automatic restart is **not** in this phase — it needs a Player-side
watchdog and its own ADR.

---

## 9. Audit matrix

| event | actor | before/after | reason required |
| --- | --- | --- | --- |
| create / edit Channel | yes | yes | no |
| **deliberate overwrite** (ADR 0033) | yes | yes | no — but recorded as its own event type |
| activate / deactivate | yes | yes | no |
| delete Draft | yes | before only | no |
| assign / remove Media Device | yes | yes | no |
| policy override change | yes | yes | no |
| acknowledge / resolve incident | yes | status only | no |
| Capture Now | yes | n/a | no |
| Manual Restart | yes | n/a | **yes** |
| retention purge | worker | counts only, **batch-level** | n/a |

Credentials, tokens and signed URLs are redacted. Retention purge is audited **per batch run**, not
per telemetry row — a per-row audit of a 90-day purge writes more rows than it deletes.

---

## 10. Retention worker

- Telemetry: **90 days**. Screenshots: **30 days**. Per Organization.
- Storage objects are **actually deleted**, not hidden from the UI.
- Batch run, audited at batch level (§9).
- **Running this against production is a separate approval.** The first run must be preceded by a
  dry-run that reports exact counts and byte totals per Organization. Deleting data is irreversible
  regardless of how much it looks like exhaust.
- Storage deletes go through the Storage API with the **`apikey`** header —
  `SUPABASE_SERVICE_ROLE_KEY` is an `sb_secret_…` key, not a JWT, and `Authorization: Bearer` returns
  `Invalid Compact JWS`.
- Audit Log retention per Organization is **not verified**; the worker must not assume it outlives
  telemetry retention.

---

## 11. Milestones and UI visibility

A control ships only when its end-to-end contract works. No button appears before the thing behind
it responds.

### 14.1 — Observability
Channel CRUD, lifecycle, membership, reservations, display expectation, derived Channel Health,
heartbeat and last seen. Uptime, player version, storage trend and History are the telemetry-gated
slice below — not part of this milestone's core.
**UI:** list with lifecycle counts and health counts (separate groups), detail, View / Edit /
Activate / Deactivate / Delete Draft. No Preview, no Capture, no Restart.
**Gates:** capability enforcement in Thunder_Core (otherwise read-only). History and uptime are
**not** part of this milestone's shippable core — they have their own gate, below. Until it clears,
the detail page shows last seen and health only.

### 14.2 — Policy & Alerts
Effective policy with source, Organization defaults + sparse Channel overrides, sweep rewrite,
incident lifecycle `OPEN → ACKNOWLEDGED → RESOLVED`, In-app + Email notification.
**UI:** policy editor, incident list, acknowledge.
**Gates:** none that block the milestone. In-app notification ships regardless; Email delivery
becomes live when a provider is configured, and until then every Email attempt is recorded
`UNCONFIGURED` and reported to the policy owner. A missing provider degrades one delivery channel —
it does not hold the milestone.

### History tab — gated on telemetry, not on a milestone
Appears when `device_telemetry_history` exists **and** the Player emits telemetry beyond a
heartbeat. That can land during 14.1 or after 14.2; it is tracked as its own gate (§12) rather than
being promised by either milestone, because neither milestone controls it.

### 14.3 — Remote Operations
Capture Now, Manual Restart, command acknowledgement, TTL, execution timeout, `Partial` fan-out,
screenshot storage, audit.
**UI:** Capture Now and Manual Restart appear here, Active Channels only.
**Gates:** Player supports command polling, at-most-once execution, screenshot upload and
post-restart `Completed`. **None of this is verified.** Backend-only work cannot finish 14.3.

---

## 12. Release gates and unverified items

| item | status | blocks |
| --- | --- | --- |
| Production schema snapshot | **verified** 2026-08-19/20 | — |
| Sweep resolve-clause bug | **verified** | must be fixed with `ACKNOWLEDGED` in the same migration |
| Notification scaffolding (8 tables, 0 rows) | **verified** | — |
| `EXPECTED_ERROR` / `Already modified:` contract | **verified** (ADR 0003) | every guard message |
| Channel API is greenfield | **verified** (no `%channel%` function) | — |
| Thunder_Core capability enforcement | **not built** | all Channel writes (14.1) |
| Player: command polling, at-most-once, screenshot upload, post-restart `Completed` | **not verified** | 14.3 entirely |
| Email dispatcher / provider configuration | **not verified** | Email delivery only — **does not block 14.2**; In-app ships without it and unconfigured attempts are recorded `UNCONFIGURED` |
| Player local watchdog | **not verified** | automatic restart (out of phase) |
| Consumers of `channel_devices.role` in Thunder_Core | **not swept** | migration step 26 (the `DROP COLUMN`) |
| Player emits telemetry beyond a heartbeat (storage, version, uptime) | **not verified** | the History / uptime slice — its own gate, independent of 14.1 and 14.2 |
| `channel_devices_device_id_fkey` is `ON DELETE CASCADE` — asset delete silently drops membership | **verified, pre-existing** | Media Device deletion guard (§4), scheduled with Device management |
| Audit Log retention per Organization | **not verified** | retention worker assumptions |

---

## 13. Acceptance criteria

1. A Channel created through the UI is `Draft`, and `Draft` appears in the lifecycle counts.
2. Activating with no Media Device is refused; the message names what is missing.
3. Activating with a device already reserved by another Active Channel is refused and **names that
   Channel**.
4. Deactivating a Channel that still has an Active or Scheduled Publication is **refused** and lists
   those Publications. After they are cancelled or have Ended, deactivation succeeds and frees the
   devices for another Channel's activation.
4b. `INSERT INTO media_core.channels (tenant_id, name) …` with no `status` produces a **`draft`**
   row, not an `active` one.
5. Removing a Media Device from a Channel with an Active or Scheduled Publication is refused and
   **lists those Publications**.
6. Assigning a portrait device to a landscape-expectation Channel is **blocked**; a 1280×720 device
   on a 1920×1080 expectation warns and proceeds after confirmation.
7. A Channel with **no** display expectation shows no confirmation prompt on assignment.
8. Two browser tabs editing one Channel: the second save returns 409 and offers โหลดใหม่ /
   บันทึกทับ. Overwrite is recorded as its own audit event.
9. A Channel with one Offline and one Online member reads `Degraded`; all Offline reads `Offline`;
   no members reads blank, not `Online`.
10. An acknowledged incident still auto-resolves once the device is healthy for two sweeps.
11. A device that emits one heartbeat and drops again does **not** resolve its incident.
12. With no Email provider configured, the In-app notification still arrives and the Email attempt is
    recorded `UNCONFIGURED` and reported — the Incident is unaffected.
13. A notification rule whose Team resolves to zero members records a delivery failure and notifies
    nobody else.
14. A hard-delete attempt on a Channel that has ever been Active is refused, whatever its current
    status.
15. Every migration preflight in §2 fails loudly on conflict and changes no data.
16. Deleting a `public.assets` row that is currently reserved is **refused** by the FK, not silently
    cascaded.
17. Re-running the notification dispatcher for the same incident phase inserts no second delivery
    row — including the `NO_RECIPIENT` case.
18. A high-severity alert raised inside a user's quiet hours is delivered, and the delivery row has
    `pierced_quiet_hours = true`. A reminder inside the same window is **not** delivered.
19. Two platform-seed `channel_types` rows with the same `code` and `tenant_id IS NULL` cannot both
    be inserted.
20. Picking a Channel Type whose `channel_category` differs from the Channel's is refused.
21. A `SENT` delivery row cannot be written with a NULL `recipient_user_id`, and a `NO_RECIPIENT`
    row cannot be written with one.
22. Capture Now on a three-device Channel writes three command rows sharing one `operation_id`; the
    operation reads `Partial` when one device fails and the others complete.

---

## 14. Housekeeping

- ADR numbering is non-contiguous: 0031 (playback behavior) and 0032 (playlist Output Profile) were
  claimed by concurrent playlist work while this set was under review. The Channel set is 0030,
  0033, 0034, 0035. `src/features/playlists/output-profile.ts:4` correctly cites 0032 for the
  playlist profile and needs no change — the Channel-side geometry rule is a different concept in
  ADR 0034.
- `CONTEXT.md:46` claimed no `locations` table existed. Corrected in this change set —
  `public.locations` exists and `channels.location_id` references it.
- `CONTEXT.md`'s Roles section now grants the Media Operator Channel management. ADR 0030 is the
  record of that reversal.
