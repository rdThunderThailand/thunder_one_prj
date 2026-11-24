# Asset Workspace Inventory and Settings: Core Gap Assessment

Date: 2026-10-26 (Asia/Bangkok)
Status: Read-only assessment; proposed technical structure, not an accepted ADR. Updated with inspection-table findings on 2026-10-26.

## Evidence and scope

- Product source: [Data & Domain Model v1.1.5](https://docs.google.com/document/d/1_wSa34jdBuQUPy7s-CtaSzKp0m905zBI/edit), sections 2.1–2.8.
- Product source: [Functional Specification v1.1.5](https://docs.google.com/document/d/1LCDCy4oSG2SxwbKfmCusavqw_jxTDDC0/edit), sections 4.12–4.13, read through the signed-in browser.
- Current Core public schema metadata: authenticated, read-only `GET /rest/v1/` with OpenAPI content negotiation. Checked both configured hosts: `ftfmokgphewzyxzwjitv.supabase.co` (`.env`) and `sfiefevtxalqjizdkcsw.supabase.co` (`.env.production.local`). Relevant master relations and `tenant_settings` appear in both. Detailed relationship inspection used the latter host.
- Local Core source: migrations, asset types, asset detail gap analysis, and searches for settings consumers. No `tenant_settings` reference was found in Core `src` TypeScript/TSX files searched.
- This is metadata and source evidence, not proof of working APIs, authorization, complete private-schema coverage, or application behavior. No business records were fetched; no database writes or migrations were performed.

## Meanings from the approved product baseline

Inventory means a controlled asset verification round, not quantity-on-hand stock management. It owns sessions, frozen expected asset snapshots, verification assignments, verification results, findings, and reconciliation decisions.

Settings means defaults within the current Organization. Changes affect future work and must not rewrite existing asset tags, generated labels, or started inventory snapshots. Personal preferences remain with the Platform Shell.

## Existing Core structures

| Requirement | Current live public relation / fields | Fit and limitation |
| --- | --- | --- |
| Asset identity and category | `assets.id`, `tenant_id`, `asset_code`, `asset_category_id`; `asset_categories` | Reuse master identities. Verify required/unique tag constraints and category behavior before implementation. |
| Physical location | `locations.id`, `tenant_id`, `parent_location_id`, `code`, `name`, `location_type`, `status`; `assets.location_id` | Strong starting point for location hierarchy. Verify approved location type, activation, and archive rules. |
| Other location representations | `sites`; `asset_locations.asset_id`, `site_id`, coordinates, `zone_id` | Existing alternative representations; choose and document the canonical mapping instead of synchronizing several by assumption. |
| Person / OU references | `memberships`, `departments`; `assets.responsible_user_id`, `custodian_org_unit_id` | Useful references; not a complete time-bounded custody or inventory assignment model. |
| Current asset state | `assets.lifecycle_stage`, `operational_status`, `condition_grade`, other legacy status columns | Map approved business meanings explicitly; do not assume matching vocabularies. |
| State history | `asset_status_history`, `asset_lifecycle_events`, `asset_condition_assessments` | Related history, not substitutes for session snapshots or findings. |
| Files and audit | `files`, `asset_attachments`, `audit_events`, `audit_event_changes` | Reuse shared capabilities after verifying authorization, evidence links, and append-only behavior. |
| Settings storage | `tenant_settings(tenant_id, setting_key, setting_value_json, updated_at)` | Closest existing storage primitive. Presence does not prove an Asset Settings API, validation, concurrency protection, or audit integration. |
| Asset tag/label identity | `assets.asset_code`; `asset_tags(asset_id, tag_type, tag_code, qr_url, ...)` | Related identity/tag data, not tag format defaults or a safe sequence allocator. |
| Policy records | `asset_policies(policy_code, policy_name, version_no, effective_date, document_file_id, ...)` | Policy/document records; not an equivalent to UI workspace defaults. |

The initial name-based search missed the existing `inspection_*` family. Follow-up live metadata verification confirmed `inspection_rounds`, `inspection_tasks`, and `inspection_results` on both configured hosts. These are a partial foundation for inventory; the complete approved session model is not represented by their current columns. This does not establish absence of supporting objects from every private schema.

## Follow-up: reuse existing inspection tables

| Existing relation | Verified live fields relevant to Inventory | Assessment |
| --- | --- | --- |
| `inspection_rounds` | `id`, `tenant_id`, `round_name`, `round_type`, `objective`, `start_date`, `end_date`, `status`, `created_at` | Candidate Inventory Session foundation. Current metadata has no dedicated owner, frozen scope/snapshot, or start/complete/close/cancel actor/time fields. |
| `inspection_tasks` | `id`, `round_id`, `asset_id`, `assigned_to`, `due_date`, `status`, `created_at` | Existing per-asset task; `assigned_to` references `users.id`. A direct OU/team target and grouped assignment scope are not represented. |
| `inspection_results` | `inspection_task_id`, `asset_id`, `inspected_at`, `condition_grade`, `exists_confirmed`, `location_match`, `gps_lat`, `gps_lng`, `recommended_action`, `result_status`, `inspected_by` | Strong partial fit for verification observations. No dedicated expected custody/location snapshot, actual custody/location references, or reconciliation decision relationship is represented. `recommended_action` text is not a controlled reconciliation record. |

Recommendation: design the missing Inventory semantics explicitly, then prefer additive extension of these three relations over creating parallel session/task/result tables if existing ownership permits. Keep names initially; do not rename merely to mirror the UI. The proposed inventory relations below are conceptual responsibilities, not an instruction to create duplicates of the existing inspection family.

Possible mapping: Inventory Session to `inspection_rounds`; per-asset verification work to `inspection_tasks`; verification observations to `inspection_results`. Add frozen expected assets and controlled findings/decisions; decide whether assignment grouping requires separate assignment/scope relations after checking the existing per-asset task model. A `round_type` discriminator is a candidate only if shared use is confirmed, not an assumed requirement.

Prefer a separate Inventory transaction model only if investigation confirms that inspection has a different canonical owner, active incompatible consumers, or lifecycle/constraints that make extension unsafe. Reuse shared asset/location/person/OU identities in either option.

Evidence: local searches found table references in database documentation/comments, but no direct consumers in searched Core application source or frontend source. No inspection-named RPC appeared in public REST metadata. This does not rule out external writers, generic/dynamic callers, differently named functions, or private-schema behavior.

Read-only `HEAD` requests with exact counts returned zero rows for all three tables on the `.env` host. The same count requests on the `.env.production.local` host returned HTTP 401; its row counts and actual usage remain unknown. Its table columns were visible through OpenAPI metadata. Full constraints, triggers, policies, and external consumers remain unverified. The existing state is not sufficient evidence for destructive replacement or a finalized migration.

Local `044_booking_core_schema.sql` defines `booking_core.inventory` for reservable capacity by date. Its meaning differs from asset verification; it should not be reused merely because its name matches.

## Proposed inventory structure

The following names are proposals, not existing relations or approved DDL. A dedicated domain schema versus additions to `public` remains a technical design choice.

| Proposed relation | Responsibility / key fields |
| --- | --- |
| `inventory_sessions` | Organization scope, name, description, owner, due date, scope definition, lifecycle status, start/complete/close/cancel actor and time, cancellation reason. |
| `inventory_expected_assets` | Session + asset, expected location, expected custody identity/type, category and relevant scope attributes, snapshot time. Unique session/asset; immutable after Start. |
| `inventory_verification_assignments` | Session, assignee identity/type, submission/progress state. Assignment means verification work, never asset custody. |
| `inventory_assignment_assets` | Explicit assignment-to-expected-asset scope. Define duplicate assignment rules before adding uniqueness beyond the pair. |
| `inventory_verifications` | Session + asset or unexpected identifier, actual observations, result, verifier/time, notes and evidence links. Decide resubmission/history semantics before selecting a unique key. |
| `inventory_findings` | Session, asset or unexpected identifier, mismatch/not-found/unexpected type, expected/actual context, resolution state, reporter/time. |
| `inventory_reconciliation_decisions` | Finding, decision, reason, actor/time, traceable reference to any separately authorized master correction. Baseline relationship: finding to zero or one decision. |

All transaction relations need explicit Organization isolation, including child access through session relationships. Existing foreign keys to shared masters do not by themselves establish same-Organization access.

Start must atomically freeze expected assets, create assignments, and transition to `IN PROGRESS`; notification delivery must remain consistent and retryable. Scope preview must not start a session or notify assignees.

Preserve `DRAFT -> IN PROGRESS -> COMPLETED -> CLOSED`, with approved cancellation from Draft/In Progress. Completed and Closed have different business meanings. Freeze snapshots at Start. Findings must not automatically register unexpected assets or update Asset Master. Controlled corrections need permission and audit.

## Proposed settings storage

Prefer evaluating reuse of `tenant_settings` before adding another settings table, provided the Organization-to-tenant mapping and platform ownership allow it. Namespace keys, for example `asset_workspace.asset_tags` and `asset_workspace.labels`. These are proposed keys, not current records.

- Validate a typed payload for each supported key; JSON storage must not become an arbitrary settings contract.
- Enforce authorized Asset Admin access for the current Organization on the server.
- Verify existing primary/unique constraints and add a reliable revision or compare-and-swap mechanism to prevent silent overwrites.
- Audit before/after values and actor/time. Save the intended change atomically rather than partially.
- Copy applicable defaults into new session setup. Started sessions use their frozen data regardless of later settings changes.

An alternative is a dedicated `asset_workspace_settings` relation if shared settings ownership or constraints cannot support these requirements. That adds a new storage contract and should follow evidence about the existing primitive.

Keep operational tag allocation separate from editable defaults, e.g. a proposed `asset_tag_counters` relation with an atomic allocator. Do not implement `MAX(asset_code) + 1` or increment a browser-held counter. Confirm whether the counter is Organization-wide across prefix changes before defining its key; the approved rule says no reset and no wrap.

## Approved versus proposed settings

| Tab | Approved baseline | Still proposed / unresolved |
| --- | --- | --- |
| Asset ID & Tags | Immutable system ID; Organization-unique Asset Tag; prefix 2–8 uppercase letters/digits, hyphen and six-digit number; no reset/wrap; authorized manual override. | Generation mode default; optional year segment. |
| Labels | QR authorized-profile reference; Code128 from Asset Tag; PDF, default 50 x 30 mm; QR, tag, name. | Additional fields and other sizes. |
| Inventory Defaults | Defaults apply to new sessions before Start; authorized review/adjustment; no retroactive snapshot change. | Exact categories, inclusion, due-date, notification, reminder, evidence and notes defaults listed as examples. |
| Workspace Preferences | Respect Organization/field permissions and Platform Shell boundaries. | Exact controls and Organization-versus-person ownership for some display preferences. |

Do not persist proposed example values as approved business defaults.

## Decisions before DDL

1. Confirm that product Organization maps to Core `tenant_id`. Live `assets.owner_org_id` references `departments.id`; it must not be mistaken for the tenant boundary.
2. Confirm canonical Location and custody mappings. Reusing existing master IDs is recommended; current asset fields alone do not supply time-bounded custody history.
3. Select shared `tenant_settings` versus dedicated domain settings after inspecting constraints, writers, and platform ownership. Reuse is the initial recommendation, not a completed design decision.
4. Choose inventory schema placement, verification resubmission/history rules, assignment overlap rules, and tag-counter scope across prefix changes.
5. Keep unapproved defaults and personal preference ownership open rather than turning mockup examples into requirements.

## Verification limits

Full PostgreSQL catalog constraints, indexes, triggers, RLS/RPC authorization, private schemas, existing data quality, deployed Core endpoint coverage, concurrency, and end-to-end flows were not verified. No implementation or production change is included in this assessment.
