# Now & Next — Implementation Plan

**Decision:** `docs/adr/0057-channel-first-now-and-next.md`
**Frontend:** `/Users/arty/Desktop/Thunder/project/thunder_one_prj`
**Backend:** `/Users/arty/Desktop/Thunder/project/Thunder_Core`

**Goal:** Replace the current Publication-management route with a Channel-first operational view
that tells an operator what is scheduled, what playback is confirmed, and what effective content is
coming during the next 60 minutes or 3 hours without fabricating live state.

**Implementation status (30 Aug 2026):** the Channel-first page, management-route split, responsive
Now Playing table and 15-minute interactive timeline are implemented. Core exposes the tenant-scoped
read model with player-resolver priority/recurrence parity and signed playlist-cover URLs. The four
Now & Next migrations are applied to Supabase dev project `ftfmokgphewzyxzwjitv`; main/production is
untouched. A transactional resolver fixture passed and rolled back. Dev currently has no effective
schedule, so the browser intentionally shows the development demo until real schedule data exists.
An authenticated temporary-schedule E2E also passed: a private playlist cover was signed by Core,
rendered in the Now Playing table and timeline, and navigated to Publication Detail. The Schedule
was restored immediately afterward. Frontend and Core production builds both pass.

## 1. Confirmed baseline

- `/media-workspace/publications` currently renders Draft/Active/Inactive management tabs through
  `PublicationsListPage` and calls `GET /media/publications` once per stored status.
- `GET /media/publications` returns list metadata but not Schedule, playback window or delivery
  targets.
- `GET /media/publications/:id` returns `schedule`, `playback_window`, `publication_targets` and the
  latest per-device delivery `targets`, including heartbeat/health fields.
- `playing` is the available playback acknowledgement; `delivered` proves media delivery only.
- The existing Overview selector loads Active Publication details and derives Now/Next from
  `playback_window`. Reusing that approach for every Channel would be an N+1 implementation and
  cannot produce a resolved recurrence timeline efficiently.
- There is no dedicated Now & Next/timeline endpoint. Core's player poll already owns the effective
  priority/merge rules, so the new read model must reuse those rules rather than create a competing
  frontend interpretation.

## 2. API contract

### Request

```http
GET /media/now-next?horizon_minutes=60&include_idle=false&channel_id=<uuid>&q=<text>
```

- `horizon_minutes`: allow only `60 | 180`; default `60`.
- `include_idle`: default `false`.
- `channel_id`: optional tenant-owned Channel.
- `q`: optional bounded search over Channel, Media Device and Publication names.
- The tenant comes only from authenticated server context, never from query input.

### Response

```ts
type NowNextResponse = {
  as_of: string;
  display_timezone: string;
  horizon_minutes: 60 | 180;
  freshness: {
    online_before: string;
    warning_before: string;
  };
  summary: {
    scheduled_now_channels: number;
    playback_confirmed_channels: number;
    upcoming_60m_channels: number;
    upcoming_3h_channels: number;
    total_active_channels: number;
  };
  rows: NowNextRow[];
};

type NowNextRow = {
  row_type: "channel" | "direct_device";
  channel: { id: string; name: string } | null;
  device: { id: string; name: string } | null;
  devices: Array<{
    id: string;
    name: string;
    status_level: "online" | "warning" | "offline";
    last_heartbeat_at: string | null;
    playback_state: "confirmed" | "stale" | "not_confirmed";
  }>;
  current: EffectiveOccurrence | null;
  upcoming: EffectiveOccurrence[];
  suppressed_count: number;
};

type EffectiveOccurrence = {
  occurrence_id: string;
  opens_at: string;
  closes_at: string | null;
  remaining_seconds: number | null;
  priority: "urgent" | "high" | "normal" | "low";
  output_kind: "publication" | "merged_loop";
  publications: Array<{
    id: string;
    name: string;
    publication_type: string;
    content_name: string | null;
  }>;
  scheduled_now: boolean;
  playback_state: "confirmed" | "stale" | "not_confirmed";
  suppressed: Array<{ id: string; name: string; priority: string }>;
};
```

`occurrence_id` must be deterministic for the same resolved row and opening instant; it is a read
identifier, not a persisted entity. Do not expose raw internal snapshot JSON when the UI needs only
the fields above.

## 3. Backend — Thunder_Core

> Writing a migration is R2. Applying it to the configured production Supabase project is **R0**:
> stop, show the exact function/route impact and obtain approval immediately before apply.

### A1 — Shared effective-playout SQL

- Locate the current effective-candidate and priority/merge logic in the latest `media_job_poll`
  migration; extract only if it can be shared without changing player behaviour. Otherwise copy the
  exact predicates into the read RPC and leave a parity check. Do not introduce a generic scheduling
  framework.
- Expand weekly recurrence into occurrence windows intersecting `[as_of, as_of + 3 hours]`, using
  each Schedule's stored timezone. One-time/range schedules use their persisted bounds.
- Resolve higher-priority suppression per Media Device. Preserve the current equal-priority merge
  order used by the player. Composition conflict rules remain publish-time blockers, not a new read
  rule.
- Derive Channel rows from active Channel membership and add directly targeted Media Devices as
  separate rows. A device directly targeted and also present through a Channel must not be counted
  twice for the same effective Publication.
- Use the existing liveness thresholds already used by Channel/Delivery Progress; do not define a
  new heartbeat policy for this page.

### A2 — `media_now_next_get`

- Add one tenant-filtered, read-only `SECURITY DEFINER` function with an empty `search_path`.
- Parameters: tenant, horizon, include-idle, optional Channel, optional bounded query.
- Validate horizon and tenant ownership inside the RPC.
- Compute all summary counts and rows from the same `as_of := clock_timestamp()` value.
- Return normalized timestamps, the liveness cutoffs used, and deterministic ordering:
  Channels alphabetically, then direct Media Devices alphabetically; occurrences by opening time,
  priority and stable Publication id.
- Add SQL assertions/fixtures for tenant isolation, timezone boundary, weekly recurrence, priority
  suppression, equal-priority merge, direct targeting, stale heartbeat and idle filtering.

### A3 — HTTP route

- Add `src/app/api/core/v1/media/now-next/route.ts` using the existing `apiHandler`, authenticated
  media tenant and validation patterns.
- Return safe validation/error messages; never return raw RPC errors.
- Update generated/documented API contract only where this repository normally records routes.

### A4 — Backend verification gate

- Run the standalone SQL/check path against named non-production fixtures first.
- After separate R0 approval, apply the migration, dump `pg_get_functiondef`/schema and compare it
  with the migration.
- Verify through the real HTTP route, not RPC alone, including cross-tenant rejection and both
  horizons.
- Check `/api/proxy/__config` before calling frontend evidence deployed/backend-complete.

## 4. Frontend — thunder_one_prj

### B1 — Preserve management

- Mount the existing `PublicationsListPage` at `/media-workspace/publications/manage` unchanged
  except for route-aware links if required.
- Add a clear `Manage Publications` navigation action from Now & Next. Preserve Create, edit,
  cancel, duplicate and delete behaviour; do not rewrite the list in this project.

### B2 — Types and service

- Add the response types from §2 under the existing Publications feature namespace.
- Add one `fetchNowNext()` service through the existing media proxy/request helper.
- Abort or ignore stale requests when filter/horizon changes. No new dependency and no client-side
  recurrence or priority resolver.

### B3 — Pure presentation derivation

- Keep only formatting/filter state in a small pure module: status labels, duration formatting,
  timeline percentage positions and priority colours.
- Leave one `node:assert` `*.check.mts` covering timeline clipping, open-ended occurrences,
  deterministic priority colours and stale/confirmed labels.

### B4 — Page shell and states

- Header: `Now & Next`, evidence-qualified auto-refresh indicator, compact server time/timezone and
  last-updated text.
- Controls: local search, Channel filter, 60m/3h horizon and Show idle toggle. Render advanced
  Filters, Live View and overflow actions disabled with an explanation; omit Group by Channel and
  date selection.
- Summary cards: Scheduled Now, Playback Confirmed, Upcoming 60m and Upcoming 3h. Each label gets a
  concise definition tooltip.
- Now Playing table: Channel/direct device, scheduled state, effective Publication or merged-loop
  group, content kind, playback evidence, occurrence time remaining and next effective occurrence.
- Timeline: one row per Channel/direct device, expandable device evidence, clipped occurrence
  blocks, suppression indicator and expandable merged-loop members.
- Every fetched surface has a geometry-preserving skeleton. Provide explicit empty, error,
  partial/stale and no-match states; never retain old rows under a fresh `Live` label after refresh
  fails.

### B5 — Refresh behaviour

- Fetch immediately, then every 60 seconds while the document is visible; pause while hidden and
  refresh on return.
- Display response `as_of`, not the browser request-start time.
- Preserve the last successful response during a transient failure only with a prominent
  `Data may be stale` state and its timestamp.

### B6 — Frontend verification gate

- Run the focused `*.check.mts`, `pnpm exec next typegen`, TypeScript, lint and build commands that
  exist in this repository.
- Verify responsive layout at the actual desktop viewport and one narrower supported viewport.
- Before final browser verification, ask the user to choose self-run browser check, checklist or
  skip, per repository rules.
- Browser acceptance must use authenticated real API data and cover: both horizons, search,
  Channel filter, idle toggle, merged/suppressed state when fixtures exist, stale refresh handling,
  navigation to Channel/Publication detail and management-route preservation.

## 5. Delivery sequence

1. Implement and check Core read model locally.
2. Add the Core route and verify its HTTP response locally.
3. **R0 gate:** request approval before applying the migration to production-backed Supabase or
   deploying Core.
4. After the endpoint is reachable from the frontend environment, implement types/service and the
   Now & Next page.
5. Move the existing management route and verify every existing action still resolves correctly.
6. Run static/focused checks.
7. Ask for browser-verification choice, then execute the selected evidence path.

Backend and frontend should not be developed against invented production-like mocks. A minimal
local fixture is acceptable only for deterministic SQL/check coverage; the final browser result is
blocked until the authenticated HTTP contract is available.

## 6. Explicitly deferred

- Current Asset/Playlist slot and exact item time remaining.
- New player telemetry or acknowledgement protocol.
- Realtime push/WebSocket subscription.
- Future-date Calendar/Schedule Preview.
- Live View, advanced filters and monitoring mutations.
- Per-Location timezone evaluation; Schedule timezone remains the source of truth.
