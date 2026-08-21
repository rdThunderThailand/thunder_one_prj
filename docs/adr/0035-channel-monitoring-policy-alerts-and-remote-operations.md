# 0035 — Channel monitoring extends the existing sweep, alert and notification stacks rather than adding a second one

Part of the Channel set: 0030 (membership and exclusivity), 0033 (lifecycle and concurrency), 0034
(display expectation and target snapshot), this ADR.

## Context

The superseded draft proposed Channel-owned alerting, per-Device incidents and alert recipients as
if none of it existed. All of it exists, in production, running right now. Verified against
`ThunderCore` (`sfiefevtxalqjizdkcsw`) on 2026-08-19/20:

**A device-offline sweep is already live.**

```
cron.job:  media-sweep-device-offline | */5 * * * * | SELECT public.media_sweep_device_offline();
```

`public.media_sweep_device_offline()` takes no arguments. It opens an incident for every
`public.assets` row with `now() - last_heartbeat_at > interval '5 minutes'`, deduplicating with
`NOT EXISTS (… status = 'OPEN')`, and resolves an open incident the moment
`now() - last_heartbeat_at <= interval '5 minutes'`. The 5-minute threshold is a literal in the
function body.

**Its output is already there.** `public.alert_incidents` holds 56 rows — every one
`event_code = 'device_offline'`, every one `rule_id IS NULL`, statuses `OPEN` and `RESOLVED`
(uppercase). `alert_incidents_has_cause CHECK (rule_id IS NOT NULL OR event_code IS NOT NULL)` is
what permits the null rule.

**`public.alert_rules` has 0 rows.** The producer has never read it. Its shape is a single-metric
threshold rule: `tenant_id, name, asset_category, target_attribute (default 'health_score'),
operator (default 'LT'), threshold, severity, is_enabled, event_code`.

**A full notification stack exists as unused scaffolding** — eight tables, all 0 rows:
`notification_event_types` (has `entity_type`), `notification_rules` (`recipient_strategy`,
`recipient_config_json`, `channel_policy_json`, `dedup_window_seconds`, `cooldown_seconds`),
`notification_preferences` (`channel_code`, `mute_until`, `quiet_hours_start/end`, `timezone`),
`notification_inbox` (`entity_type`, `entity_id`, `deeplink_url`, `expires_at` — and **no**
`channel_code`), `notification_providers` (`channel_code`, `status`, `last_tested_at`),
`notification_channels` (`code`, `name`, `is_active`), `notification_templates`,
`notification_action_logs`.

Device-level health thresholds already exist on the frontend too:
`src/features/publications/channels-logic.ts:5-8` — over 2 minutes is `warning`, over 5 minutes is
`offline`.

## Decision

### Channel Health is derived, never stored

| condition | Channel Health |
| --- | --- |
| every member Online | `Online` |
| no member Offline, at least one Warning | `Warning` |
| at least one Offline **and** at least one Online or Warning | `Degraded` |
| every member Offline | `Offline` |
| no members | `null` |

`Degraded` exists **only** at Channel level. A Media Device stays `Online | Warning | Offline`, as
`src/types/domain.ts` already declares. Health is computed on read from member heartbeats and is
never persisted — a stored health column is a value that goes stale exactly when it matters, and it
is the failure ADR 0028 documents for the playlist Inactive counter.

Channel Health is presented separately from lifecycle. The list shows lifecycle counts (`Draft` /
`Active` / `Inactive`) and health counts as two independent groups.

### Policy: `System Default → Organization Override → Channel Override`

Only overrides are stored. A Channel row carries the keys an operator actually changed, nothing
else. The read API returns the **effective** policy with each value's **source**, so the UI can say
"30 minutes (Organization)" instead of showing a number with no provenance.

An incident **snapshots the effective policy and its version at the moment it opened**. An incident
that opened under a 5-minute threshold must keep explaining itself after someone changes the
threshold to 30.

### The existing sweep is extended, not replaced

- `media_sweep_device_offline()` **keeps its zero-argument signature** — `cron.job` invokes it
  literally as `SELECT public.media_sweep_device_offline();`, and changing the signature means
  editing the cron entry in lockstep. Per-tenant policy is looked up inside the function.
- The hard-coded `interval '5 minutes'` is replaced by the effective policy threshold per device.
- Status vocabulary is the existing uppercase set, extended by one: **`OPEN`, `ACKNOWLEDGED`,
  `RESOLVED`**. Not `Open/Acknowledged/Resolved` — 56 rows already use uppercase.
- **`OPEN` and `ACKNOWLEDGED` are both "active".** This is a correctness fix, not a preference: the
  sweep's resolve clause is `WHERE i.status = 'OPEN'`, so adding `ACKNOWLEDGED` without widening it
  would leave every acknowledged incident open forever. Dedupe and auto-resolve both change to
  `status IN ('OPEN','ACKNOWLEDGED')` in the same migration that introduces the value.
- Dedupe moves from `NOT EXISTS` to a database guarantee:
  `UNIQUE (asset_id, event_code) WHERE status IN ('OPEN','ACKNOWLEDGED')`. The current check-then-
  insert races if two sweeps overlap. The migration **preflights for existing duplicates and fails
  with a report** if any exist rather than deleting rows to make the index build.
- **Recovery takes two consecutive healthy observations.** The first sweep that sees a device
  healthy records `recovery_observed_at`; the next sweep that still sees it healthy resolves the
  incident. Going offline again clears `recovery_observed_at`. One heartbeat arriving from a device
  that is power-cycling is not a recovery.

  *Consequence to accept:* the cron runs every 5 minutes and the default threshold is 5 minutes, so
  recovery is visible 5–10 minutes after the device returns. **A policy threshold below the cron
  interval has no effect** — the cadence is the floor. Changing one requires changing the other.

### Notifications reuse the eight-table stack

No Media-specific notification subsystem is built. Alerts link to incidents with
`entity_type = 'alert_incident'` and `entity_id = <incident_id>` — columns `notification_inbox` and
`notification_event_types` already have.

- Delivery channels for this phase: **In-app and Email**.
- **In-app works even when no Email provider is configured.** In-app delivery is a row in
  `notification_inbox`; it has no external dependency and must not be gated on Email.
- Email with no configured provider is recorded as `FAILED / UNCONFIGURED` and **reported to the
  policy owner**. It is never silent.
- **A delivery failure never suppresses or closes an Incident.** The incident is the fact; the
  notification is an attempt to tell someone about it.
- Recipients are existing Organization Users or Teams. A Team resolves to its **current** members at
  send time, not at rule-creation time.
- **A recipient set that resolves to nobody is recorded as a delivery failure.** The system does not
  widen the audience to the whole Organization to find someone to tell.
- Idempotency is per **Incident × Event × Recipient × Delivery Channel**, so a re-run of the
  dispatcher cannot double-notify.

**Known schema gap:** none of the eight tables stores a per-delivery-attempt row.
`notification_inbox` is the in-app payload and has no `channel_code`; `notification_action_logs`
records what the *user* did; `notification_providers.status` is provider-level. `FAILED /
UNCONFIGURED` and the idempotency key therefore need a new `notification_deliveries` table. This is
recorded as a known gap in `docs/channels/plan-channels-monitoring.md`, not discovered during
implementation.

**Quiet hours and mute do not silence a high-severity alert.** `notification_preferences` carries
`mute_until` and `quiet_hours_start/end`, which can suppress a `device_offline` notification exactly
as effectively as an unconfigured provider can. High-severity alerts therefore **pierce** both, and
the pierce is recorded on the delivery row so a 3am notification carries its own justification.
Everything below high severity obeys the preference. Reminders inside the cooldown never pierce —
only the opening notification and the resolution.

This follows from the rule two paragraphs up: if a delivery failure must not hide an Incident,
neither may a preference setting. The difference is that a preference is a choice the user made, so
the carve-out is limited to the severity where being told late is equivalent to not being told.

### Remote Operations

- Commands reach the Player by **authenticated polling**, the same direction the existing
  heartbeat/poll cycle already uses. No inbound connection to the device is assumed.
- Every command carries an **immutable `command_id`**. The Player executes a given `command_id`
  **at most once**; re-polling the same command is a no-op that re-reports the existing result.
- **TTL bounds acceptance, not execution.** TTL expiring means "the Player never picked this up".
  Execution has its own separate timeout. Conflating them marks a command that is running as failed.
- A command is queued rather than rejected on a stale liveness reading. Liveness is at best 5
  minutes old (see the cron cadence); refusing on it would reject commands to devices that are up.
- **Restart succeeds only when the Player reports `Completed` after coming back up.** Acknowledging
  a restart request is not evidence that the restart happened.
- Screenshot upload goes to a **scoped signed target**, issued per command. Signed URLs are redacted
  from audit records.
- A fan-out across a Channel's members reports **`Partial`** when some members succeed and others do
  not. There is no all-or-nothing rollup that hides a failed screen behind a green Channel.
- Remote commands through a Channel are available on **Active Channels only**. A Draft Channel's
  reservations do not exist yet and an Inactive Channel is not operating.
- The first delivery exposes **Manual Restart only**. Automatic restart stays disabled until the
  Player has a reliable local watchdog; when it lands it needs its own offline threshold, cooldown,
  retry limit and audit trail, and its own ADR.

## Rejected alternatives

**Build Channel-owned alerting with its own tables (the superseded draft's position).** Rejected on
evidence: `alert_incidents` already produces exactly the `device_offline` incident this feature
needs, keyed on the same `assets.id` that `channel_devices.device_id` references. A parallel system
would mean two rows for one outage and two places to acknowledge it.

**Drive everything through `alert_rules` as it stands.** The obvious reading of "reuse the existing
tables". Rejected as insufficient rather than wrong: the table has 0 rows, the live producer ignores
it, and its shape is a single numeric threshold against `target_attribute` — it cannot express the
three-level precedence, per-Channel overrides or the screenshot-interval and storage-warning
settings. Rules stay the vocabulary; the effective-policy resolver is what the sweep actually reads.

**Give the sweep parameters (`media_sweep_device_offline(p_tenant_id …)`) and call it per tenant.**
Rejected: it changes the signature that `cron.job` invokes, and `CREATE OR REPLACE FUNCTION` with an
added parameter creates an overload instead of replacing — every existing call becomes ambiguous.
Keeping the zero-arg entry point makes the change a body-only replacement.

**Resolve on the first healthy heartbeat, as the function does today.** One line simpler and faster
to clear. Rejected: a device that power-cycles emits one heartbeat and disappears, closing the
incident that would have told someone it is flapping.

**Store Channel Health so lists can sort and filter on it cheaply.** Rejected: it is a function of
member heartbeats that change every few minutes, so the stored value is wrong most of the time, and
ADR 0028 documents exactly this failure for playlist status. If aggregation cost becomes real,
a materialised read model is the upgrade path, not a column an operator can watch go stale.

**Build a Media notification subsystem because the existing stack is empty scaffolding.** Rejected:
`notification_rules` already models recipient strategy, channel policy, dedup window and cooldown —
every requirement of this feature — and `notification_inbox` already has `entity_type`/`entity_id`.
Being unused is not the same as being unsuitable. Building a second one guarantees the platform
never gets one notification centre.

**Widen recipients to the whole Organization when a Team resolves to nobody.** Rejected: an alert
sent to everyone is an alert owned by nobody, and it trains the Organization to filter the sender.
An empty recipient set is a configuration defect and is reported as one.

**Reject remote commands to devices that look offline.** Rejected: liveness is up to 5 minutes
stale, so this refuses commands to devices that are actually up. TTL expiry says the same thing
honestly, after the fact.

## Consequences

- `media_sweep_device_offline()` gets a body rewrite: policy lookup, `ACKNOWLEDGED` in both dedupe
  and resolve clauses, and the two-observation recovery. Its signature and cron entry are untouched.
- New columns on `alert_incidents`: `recovery_observed_at`, and the policy snapshot the incident
  opened under.
- A new partial unique index whose creation can fail on existing duplicates — a deployment step with
  a human in it.
- A new `notification_deliveries` table (or equivalent), because the existing eight cannot record a
  delivery attempt.
- Monitoring milestones are gated on things outside this repo: command polling, screenshot upload
  and post-restart `Completed` reporting all require Player support that is **not verified to
  exist**, and Email requires a configured provider that is **not verified to exist**. Those are
  release gates in the plan, not assumptions in this ADR.
- Retention (telemetry 90 days, screenshots 30 days, per Organization, storage objects actually
  deleted) is a recurring destructive job. Its scoping, schedule and audit shape are specified in
  the plan; running it against production is a separate approval.
