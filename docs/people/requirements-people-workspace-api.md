# Requirements: People Workspace API (Thunder_Core)

> Written 2026-08-28 · Requested by: Thunder One frontend team
>
> **Update 2026-08-28:** Core replied — see `core-response-people-workspace-api.md`. This wasn't
> as greenfield as assumed: P1 (roster) and P2 (org units) largely already exist as
> `public.users`/`memberships`/`departments` and were extended, not built from scratch. §8 Q1/Q3/Q4/Q7
> below are resolved (see `frontend-answers-to-core.md` for our side of Q1/Q4); only Q6 (`fillRate`
> formula) is still open on either side. P3–P7 remain genuinely greenfield — no schema exists yet.
>
> **Update 2026-08-28 (later the same day):** P1/P2 **read** paths are now wired into the real
> frontend (`people/personnel`/`people/org-structure`'s `services/*-api.ts` + `core-mapper.ts`,
> contract confirmed with Core in the same reply). `employeeCount` on org units is now real
> (computed client-side from the members list); `headName`/`headTitle`/`positionsCount`/`fillRate`
> still render `"-"` — flagged §8 Q8 (`role_code`) and Q9 (`manager_id`) as new open questions.
>
> **Update 2026-08-28 (same day, third pass):** Core answered Q8/Q9 (both resolved, see §8) — Q9 is
> live server-side (`manager_id` now in `GET /tenants/:id/organizations`, wired into
> `core-mapper.ts`, real head names on the Org Structure detail panel). Q8 unblocked
> `people/new-hires`'s `AddEmployeeModal`, which **now calls Core's real `POST
> /tenants/:id/members`** end to end — see §5's update note. `AddPersonModal` (`people/personnel`)
> is still client-local only; wiring it the same way is a natural next step, not done yet.
>
> Scope: the entire **People** App (`/people/**`, `src/features/people/**`) — new this sprint,
> mock data on our side throughout. Source mockups: a set of Thai-language HR dashboard screenshots
> plus one domain diagram ("เพิ่มคน / เพิ่มพนักงานใหม่ ต่างกันอย่างไร?"), both supplied by the
> business side, not by Core.

## TL;DR

7 pages + 2 create flows, all reading/writing one underlying **Person** entity today spread across
5 separate mock-data files with no shared source of truth. The single most valuable thing Core can
do first is stand up **Person + Membership** as real, shared concepts (see §1) — every page below
is a view or a mutation on that same data, and building it 5 times independently (once per mock
file) is exactly the duplication we want to avoid carrying into the real implementation.

Priority order below is ours (frontend), based on which pages are reachable first in the nav and
how much of the rest depends on them. Core should correct it based on actual schema/effort — same
caveat the Asset Detail Page doc gave.

## 0. Domain model (read this first — everything below is a view on it)

Per the reference diagram, every page in this App is ultimately about one of these five concepts:

| Concept | Meaning | Cardinality |
|---|---|---|
| **Person** | One unique human identity — name, contact info, ID docs. Never duplicated. | 1 per human |
| **Membership** | A person's relationship to the org. | A person may hold >1 (e.g. an ex-employee who returns as a contractor) |
| **Member Type** | `employee` \| `contractor` \| `partner` \| `guest` — determines process + policy. **Only `employee` counts toward headcount.** | 1 per Membership |
| **Access & Role** | System/data access granted to a Membership, least-privilege. | 1..n per Membership |
| **Lifecycle** | `onboarding → active → change → offboarding`, tracked continuously. | 1 state per Membership |

**Two distinct creation flows, not one:**
- **"เพิ่มคน" (Add Person)** — any Member Type. Creates Person + Membership + Member Type + Access.
  Contractor/Partner/Guest complete this flow fully; picking Employee redirects to the flow below
  instead (the frontend enforces this today — see §5's `AddPersonModal` note).
- **"เพิ่มพนักงานใหม่" (Add Employee)** — Employee only. Runs the full 5-step onboarding intake
  (personal info → position/unit → documents/contract → equipment/access → training/readiness) and
  only this flow should mark someone counted in headcount / eligible for the Onboarding lifecycle
  stage.

**Open question for Core:** should Member Type be closed-enum (employee/contractor/partner/guest,
as modeled everywhere below) or an open lookup table? The reference diagram treats it as closed;
flagging in case Core's org already has a broader partner/vendor taxonomy this should map onto
instead of introducing a second one.

## Suggested path

**P1 → P2** first (Person/Membership + roster read is the foundation everything else queries).
**P3 → P4 → P5** next (New Hires, Changes, Departures — all three are "list + a stateful workflow
on a Person/Membership", same shape, different Lifecycle stage). **P6 → P7** last (Policy /
Knowledge Base are a content system, not really "people" data — could reasonably live in a
different service entirely; flagged as its own open question in §8).

---

## P1 — Person & roster (`people/personnel`, `/people/personnel`)

The base entity every other page's `PersonNN`/`hireId`/etc. foreign-keys onto.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `email` | string | |
| `employeeCode` | string | Prefixed by Member Type today (`EMP-`/`CON-`/`EXT-`) — confirm Core wants to keep that convention or issue its own scheme |
| `position` | string | Free text on our side; see §5's note on whether this should become a real lookup |
| `unit` | string | Currently a flattened `"Division / Team"` label — should really be a foreign key to the Org Unit in P2, not a string |
| `type` | enum: `employee` \| `contractor` \| `partner` \| `guest` \| `inactive` | = Member Type + a derived "left the org" state; confirm with Core whether `inactive` should be a Member Type value or a separate Lifecycle flag |
| `workStatus` | enum: `active` \| `on-leave` \| `invited` \| `inactive` | |
| `startDateLabel` | date, nullable | We send/receive ISO; frontend formats to Thai Buddhist calendar itself (`src/lib/thai-date.ts`) — Core should **not** localize dates, just return ISO |
| `managerName` / `managerRole` | string, nullable × 2 | Should really be `managerId` → resolved Person, not a denormalized name/role pair — see §8 |

**Endpoints needed:**
- `GET /people` — list, with server-side pagination/filtering (status, unit, team, type,
  work status — the 5 filters the UI already has dropdowns for) and **real aggregate counts** for
  the type/status tabs. Today those counts (128/112/9/4/3/6 etc.) are hardcoded mockup numbers that
  don't match the 10 sample rows we actually have — real counts should come from this endpoint, not
  be a separate hand-maintained number.
- `POST /people` — create (backs `AddPersonModal`, §5)
- Search (`ค้นหาชื่อ, อีเมล, รหัสพนักงาน, ตำแหน่ง...`) — full-text across those 4 fields

## P2 — Org units (`people/org-structure`, `/people/org-structure`)

A tree, not a flat list — every unit has a parent (root's `parentId` is `null`) and 0..n children.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `headName` / `headTitle` | string | Same denormalization concern as `managerName` above — should resolve to a Person |
| `employeeCount` | number | **Server-computed** — count of `Person.type === "employee"` whose `unit` resolves to this node (or any descendant, for a non-leaf node) |
| `unitCode` | string | |
| `unitType` | string | Only one value (`"สายงานหลัก"`) exists in our mock data — ask Core what the other unit types actually are before treating this as free text |
| `teamsCount` / `positionsCount` / `fillRate` | number | `fillRate` in particular needs a real definition from Core — our mock value for one node (83%) doesn't reconcile with headcount/positions math, and we don't know the intended formula |
| `parentId` | string, nullable | |
| `childIds` | string[] | Could instead be derived (query children by `parentId`) rather than stored — Core's call |

**Endpoints needed:**
- `GET /org-units` — full tree (or flat list + `parentId`, frontend can build the tree). Feeds both
  the org chart (`OrgChartNode`, recursive render) and the "หน่วยงาน" picker in `AddEmployeeModal`
  (§5) — that picker currently reads this tree's mock version directly, so it needs the real thing
  to stay in sync.
- `POST /org-units`, `PATCH /org-units/{id}`, `DELETE /org-units/{id}` — the mockup's
  Add/Edit/Delete Unit buttons, currently inert

## P3 — New Hires / Onboarding (`people/new-hires`, `/people/new-hires`)

A Membership in the `onboarding` Lifecycle stage, plus a checklist.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| *(person fields)* | | `name`, `employeeCode`, `position`, `unit`, `managerName`/`managerRole` — same denormalization note as P1 |
| `startDateLabel` / `daysLeftLabel` | date / derived | `daysLeftLabel` should be server-computed (`startDate - today`) or just not sent at all — frontend already derives it client-side from a real date (`formatDaysUntilThai`) |
| `progress` | number (0–100) | **Should be server-computed from `steps`**, not stored independently — see the flag below |
| `status` | enum: `in-progress` \| `pending` \| `not-started` \| `completed` | |
| `steps` | `{ label, done, pendingLabel }[]` | See below |

**Flag from a bug we found in the source mockup, so Core doesn't repeat it:** the mockup's own
"เสร็จสิ้น X จาก 9" summary number (6) didn't match its own itemized checklist (5 items actually
checked). Our frontend now computes that count from the rendered `steps` array instead of trusting
a separately-stored number. **Recommend Core do the same** — derive `progress`/"done count" from
the checklist rows at read time, don't store it as an independent column that can drift.

**The 9 onboarding steps are currently a hardcoded, fixed sequence** (`ข้อมูลบุคลากร`,
`โครงสร้างและตำแหน่งงาน`, `บัญชีผู้ใช้และสิทธิ์การเข้าถึง`, `อุปกรณ์และทรัพยากร`,
`แอปพลิเคชันที่จำเป็น`, `นโยบายและเอกสาร`, `การอบรมที่จำเป็น`, `เตรียมความพร้อมผู้จัดการ`,
`พร้อมเริ่มงาน`) — same 9 for every hire regardless of position/department. **Open question:**
does this need to vary by unit or position (e.g. Engineering gets an extra "dev environment setup"
step), or is one fixed template fine for v1? If it needs to vary, this becomes a template/checklist
table, not a hardcoded enum.

**Endpoints needed:**
- `GET /onboarding` — list + real tab counts (same "hardcoded mockup number vs. small sample" gap
  as P1)
- `POST /onboarding` — backs `AddEmployeeModal` (§5); this is the **only** creation path that
  should set Member Type = `employee` and start the Lifecycle at `onboarding`
- `PATCH /onboarding/{id}/steps/{stepIndex}` — mark a step done (currently the wizard marks steps
  done client-side when advancing through its own 5 UI steps; a real "ดำเนินการขั้นตอนถัดไป" button
  on the detail panel needs this)

## P4 — Changes (`people/changes`, `/people/changes`)

A Membership in the `change` Lifecycle stage — this is the one page with a real approve/reject
workflow already built client-side (`ChangeDetailPanel`), currently **local state only, not
persisted**, matching how `asset-intelligence/departments`'s Requests page also stays local pending
a real endpoint.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| *(person fields)* | | `name`, `employeeCode` |
| `changeType` | enum: `transfer` \| `position` \| `manager` \| `salary` \| `employment-type` \| `location` \| `work-hours` \| `company` | |
| `fromValue` / `toValue` | string | Free text today (e.g. `"45,000" → "50,000"` for salary) — ask Core whether typed fields (a real number for salary, a real unit-id for transfer) are wanted instead of stringly-typed before/after |
| `effectiveDateLabel` | date | |
| `status` | enum: `pending-approval` \| `in-progress` \| `needs-info` \| `completed` \| `cancelled` | |
| `requesterName` / `requesterRole` | string | Same denormalization note as elsewhere |
| `requestedDateLabel` | date | |
| `reason` | string | |
| `note` | string, nullable | |
| `before` / `after` | `{ unit, team, manager, position }`, nullable × 2 | Only populated for `transfer`-type changes today |

**Endpoints needed:**
- `GET /changes` — list + real tab counts
- `POST /changes/{id}/approve`, `POST /changes/{id}/reject` — the two real buttons on our side
  today have nowhere to actually write to
- `POST /changes` — no "Create Change" flow is built yet (button is inert), but the read/approve
  side is real enough that Core may want the write side scoped alongside it

## P5 — Departures / Offboarding (`people/departures`, `/people/departures`)

A Membership in the `offboarding` Lifecycle stage — structurally identical to P3 (Onboarding) but
with a 3-state checklist (`done` / `current` / `pending`, not just done/pending) and 10 steps
instead of 9.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| *(person fields)* | | `name`, `employeeCode`, `position`, `unit` |
| `exitTypeLabel` / `exitTypeSubLabel` | string × 2 | e.g. `"ลาออก" / "Resignation"` — likely wants to be a real enum (`resignation` \| `contract-end` \| `retirement` \| `cancelled`) rather than two free-text strings |
| `exitDateLabel` / `daysLeftLabel` | date, nullable × 2 | `null` for a cancelled process |
| `status` | enum: `in-progress` \| `due-soon` \| `completed` \| `cancelled` | |
| `progress` | number, nullable | Same "should be server-computed from steps" flag as P3 |
| `responsibleName` / `responsibleRole` | string | |
| `updatedDateLabel` / `updatedTimeLabel` | date / time | |
| `steps` | `{ label, state, dateLabel? }[]` | `state` = `done` \| `current` \| `pending`; `dateLabel` only set for `done` steps (when that step was actually completed) |

**Same bug flag as P3:** the source mockup's "เสร็จสิ้น 6 จาก 10" also didn't match its own
checklist (3 done + 1 current). Same recommendation: derive this at read time, don't store it
separately.

**Endpoints needed:**
- `GET /offboarding` — list + real tab counts
- `POST /offboarding` — "เริ่มกระบวนการออกจากองค์กร" (currently inert)
- `PATCH /offboarding/{id}/steps/{stepIndex}` — mark a step done, advance the `current` marker

## P6 — Policy (`people/policy`, `/people/policy`)

A plain content library — no workflow, no Lifecycle involvement. Lowest priority of the two content
pages since Personnel/Onboarding/Offboarding all depend on none of this.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` / `description` | string × 2 | |
| `categoryLabel` | string | Currently free text; a real category id + separate label table is probably right once there's >8 categories |
| `status` | enum: `published` \| `review` \| `draft` \| `retired` | |
| `version` | string | e.g. `"v2.1"` — confirm whether Core wants semver or this exact format |
| `publishedDateLabel` | date, nullable | |
| `publisherName` / `publisherRole` | string × 2 | |

**Endpoints needed:** `GET /policies` (list + category counts), `GET /policies/{id}` (no reader
page exists yet on our side, but the "eye" icon in the table implies one is coming), `POST
/policies` (currently inert).

## P7 — Knowledge Base (`people/knowledge-base`, `/people/knowledge-base`)

Also a content library, likely the same underlying system as P6 (a "policy" is arguably just a
`tagLabel: "นโยบายและระเบียบ"` article) — **flagging that P6 and P7 may not need to be two separate
schemas.** See open question below.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` / `description` | string × 2 | |
| `tagLabel` | string | Category, same free-text-vs-lookup question as P6's `categoryLabel` |
| `dateLabel` | date | |
| `authorName` / `authorRole` | string, nullable × 2 | |
| `viewCount` | number | Should be server-tracked (real view events), not editable content |

Also needed: category tiles (label + description + count), a "popular topics" ranking (presumably
`ORDER BY viewCount DESC LIMIT 5`, not manually curated), and an announcements feed (title +
subtitle + posted date — likely the same concept as P6's policy "ประกาศ" if policies and articles
turn out to share a schema).

**Endpoints needed:** `GET /knowledge/articles`, `GET /knowledge/categories`, `GET
/knowledge/popular`, `GET /knowledge/announcements`, `POST /knowledge/articles` (currently inert).
No article reader page exists on our side yet either.

---

## §5 — The two creation flows, in detail

> **Update 2026-08-28:** `AddEmployeeModal` (`people/new-hires`) is now **real** — it calls Core's
> actual `POST /tenants/:id/members`, handling both the existing-account and pending-invite
> response shapes (the latter shows Core's real `invite_url` with a copy button). `AddPersonModal`
> (`people/personnel`) is unchanged — still client-local only. Both paragraphs below describe the
> state before this update; kept for the record of what changed and why.

~~Both are **fully built and interactive on the frontend today** (`AddPersonModal` in
`people/personnel`, `AddEmployeeModal` in `people/new-hires`) but write to **client-local React
state only** — nothing persists past a page reload.~~ This is the most concrete, ready-to-wire
frontend code in the whole App; Core standing up `POST /people` and `POST /onboarding` unblocks
swapping local `setState` calls for real requests with minimal frontend rework, since the shape of
what we send is already exactly the mock row shape in P1/P3 above. **Now true for `AddEmployeeModal`
specifically** — `POST /tenants/:id/members` turned out to be that same `POST /people`, once §8
Q8/Q9 (below) resolved the two things blocking it.

One deliberate business rule already enforced in the UI: **`AddPersonModal` does not let you create
an Employee.** Picking "พนักงาน" in step 1 shows a notice and a link to `AddEmployeeModal` instead,
per the reference diagram's own guidance. Core's `POST /people` can presumably still accept
`type: "employee"` for internal/migration use, but the UI will never send that combination through
this endpoint — flagging so Core doesn't design validation that assumes otherwise.

~~`AddEmployeeModal`'s "pull from the DB" fields (ตำแหน่งงาน/หน่วยงาน/ผู้จัดการ) currently read from
P1/P2's own mock data as a stand-in for real lookups~~ — **หน่วยงาน now reads from real
`GET /tenants/:id/organizations` data** (it has to: it becomes a real `default_department_id` Core
validates). ตำแหน่งงาน/ผู้จัดการ stay mock-sourced suggestions deliberately — Core's contract has no
"manager" concept for a membership at all, and `job_title` is free text server-side, so neither
needs to be real for the call to be correct. A new required field not anticipated in the original
doc: **บทบาท (Role)**, populated from `GET /tenants/:id/roles` (§8 Q8's answer) — Core's
`role_code` requirement had no equivalent concept in our original UI at all.

## §6 — Cross-cutting: what "R&D placeholder" means across every page above

Every page listed P1–P7 currently ships with hardcoded aggregate numbers (stat tiles, tab counts)
that are the *mockup's* numbers, not derived from the small hand-picked sample of rows we actually
have (10 personnel rows standing in for "128", 8 new hires for a tab that says "8" but whose real
per-row status only sums to 3/3/2, etc.). This is intentional on our side — documented per-feature
in each `mock-data.ts`'s header comment — but it means **every count in this App today is fake**
and none of it should be treated as a spec for real numbers. The only real spec is the *shape* of
each field, covered in the tables above.

## §7 — Denormalization Core should probably not carry into the real schema

Every page above stores `xName` + `xRole` string pairs (`managerName`/`managerRole`,
`requesterName`/`requesterRole`, `responsibleName`/`responsibleRole`, `publisherName`/
`publisherRole`, `headName`/`headTitle`, `authorName`/`authorRole`) instead of a foreign key to a
Person. That's a mock-data shortcut, not a design recommendation — a real implementation should
almost certainly resolve these to `personId` and let the frontend join, so e.g. a manager's title
change doesn't require updating every row that names them.

## §8 — Open questions for Core

1. ~~**Member Type: closed enum or open lookup table?**~~ (§0) **Resolved 2026-08-28** — closed
   enum (employee/contractor/partner/guest), matching the reference diagram. See
   `frontend-answers-to-core.md`. Needs a new column on `memberships` regardless — nothing today
   models this axis (`user_type`/`role_type` are different axes, per Core's response doc).
2. ~~**`unit` as a string label vs. a foreign key to an Org Unit (P2)?**~~ **Resolved** — already a
   real FK (`memberships.default_department_id → departments`), per Core's response doc. P1/P3/P4/P5
   should reference it directly once wired up, not the flat `"Marketing / Growth"` string.
3. ~~**Should `progress`/"done count" be a stored column or always computed from the checklist at
   read time?**~~ (P3, P5) **Resolved — agreed, computed at read time.** Core confirmed they'll
   build it that way from the start.
4. ~~**Are the 9 onboarding / 10 offboarding steps a fixed global template, or do they need to vary
   by unit/position/exit type?**~~ (P3, P5) **Resolved 2026-08-28 — fixed global template**, matching
   what's already hardcoded in the frontend mock data. See `frontend-answers-to-core.md`. Unblocks
   Core's P3/P5 table design; that schema work hasn't started yet as of this doc's last update.
5. **Do Policy (P6) and Knowledge Base (P7) belong in one content schema, or two?** Core is leaning
   toward one `content_items` table with a type discriminator, not finalized — flag if there's an
   approval-flow or access-control reason to keep them separate.
6. **`fillRate` (P2) — what's the actual formula?** Still open on both sides — Core doesn't have
   this either; needs a product/business definition neither team can supply from what we have.
7. ~~**Should Person/Membership live in this App's own service, or in whatever already backs
   `public.users`/`tenant_applications` for the rest of Thunder One**~~ (per ADR 0007's multi-app
   tenant-scoping pattern, referenced in Asset Intelligence's own Core-contract questions)? **Answered
   — no**, it already is the canonical identity Thunder One uses everywhere else
   (`public.users`/`memberships`/`roles`); extend that, don't build a 6th copy. See
   `core-response-people-workspace-api.md`.
8. ~~**What `role_code` should a real `POST /tenants/:id/members` send?**~~ **Resolved 2026-08-28 —
   `GET /tenants/:id/roles` exists** (wasn't in Core's original contract dump, found on audit).
   Returns every role usable in the tenant; no role means "contractor"/"guest" specifically — Core
   was explicit that `role_code` and Member Type are different axes with no mapping between them.
   `AddEmployeeModal` now populates a real role picker from this endpoint, defaulting to
   `operator_technician` per Core's suggestion (mirrors `POST /tenants/:id/invites`'s own default).
   We did **not** ask Core for role_code/Member-Type parity (making `role_code` optional on
   `/members` with the same auto-default) — Core offered it, but a real required picker is more
   correct than relying on a server-side guess, so we didn't take them up on it. `AddPersonModal`
   (Contractor/Partner/Guest) hasn't been wired to this yet — natural next step, not done as part of
   this resolution.
9. ~~**Can `manager_id` be added to `GET /tenants/:id/organizations`'s select list?**~~ **Resolved
   2026-08-28 — done**, same day asked. It's a raw `public.users.id`, not a membership id — resolve
   it against a `GET /tenants/:id/members` row's `user_id` field, not `id`. `people/org-structure`'s
   `core-mapper.ts` now does this; the Org Structure detail panel shows a real head
   name/title wherever a unit has both a `manager_id` and that manager appears in the (paginated)
   members list fetched alongside it.
