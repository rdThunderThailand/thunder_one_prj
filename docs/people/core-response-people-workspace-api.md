# Core's response: People Workspace API

> Written 2026-08-28 · Responding to Thunder One frontend's People Workspace requirements doc
> (same date) · Status: **P1/P2 substantially exist and were just extended; P3–P7 are genuinely
> greenfield**

## TL;DR

Your doc treats this as 100% greenfield. It isn't — **Person, Membership, and Access & Role
already exist** as real, shared concepts (`public.users`, `public.memberships`,
`public.roles`/`membership_roles`), and this is the *same* identity system every other Core-backed
app already runs on (tenants, invites, app access). Building a new People-specific copy would be
the "6th copy of identity" your own §8 Q7 was worried about — don't; extend what's here instead.

**P2 (Org units)** is close to a direct hit: the `departments` table's own DB comment says
*"exposed by the core API as 'organizations'"*. **P1 (roster)** is `GET/POST
/tenants/:id/members`, which already existed before your doc landed and just got extended (below)
to carry the HR fields you listed. **P3–P7 are real gaps** — no Lifecycle-stage concept, no
onboarding/offboarding checklist tables, no changes workflow, no content library. That's where the
actual net-new schema work is.

---

## Concept mapping (your §0 table → what exists)

| Your concept | Maps to | Status |
|---|---|---|
| **Person** | `public.users` | Exists — email, first_name/last_name/display_name, avatar_url, phone, date_of_birth, status, is_active |
| **Membership** | `public.memberships` | Exists — tenant_id, user_id, status, **employee_code, job_title, default_department_id, start_date/end_date already on the table**, just weren't exposed until today (see below) |
| **Member Type** | *(nothing exact)* | **Real gap.** Closest existing things are `memberships.user_type` (`internal`/`external`, 2 values, different axis) and `roles.role_type` (includes an `employee` tier value — that's a privilege tier, not employment type; don't confuse the two). Your 4-value closed enum doesn't exist yet — needs a new column. See §8 Q1 below. |
| **Access & Role** | `roles` + `membership_roles` (tier + persona), plus `member_app_access` (per-app grants) | Exists, and more granular than your doc assumes — `member_app_access` already models "which apps/systems a membership can reach," not just a role tier |
| **Lifecycle** | *(nothing exact)* | **Real gap.** `memberships.status` (`invited\|active\|suspended\|removed\|archived`) is a different, coarser enum — it's account-access state, not your `onboarding→active→change→offboarding` process state. These are two different concepts that happen to both live on `memberships`; don't collapse them into one column. |

---

## What we just built (this session, on `feat/tenant-invite-any-email`)

1. **`MEMBER_SELECT` / `toMemberView()`** (`src/lib/core/member-view.ts`) now select and return
   `employee_code`, `job_title`, `default_department_id`, `start_date` — columns that already
   existed on `memberships` but no endpoint ever selected them, so they were invisible to every
   caller. This is your P1 `employeeCode` / `position` / `unit` / `startDateLabel` — **`unit` is
   already a real FK** (`default_department_id → departments`), not a string, answering §8 Q2.
2. **`POST /tenants/:id/members`** now accepts all four as optional input:
   - Existing-account email → written straight onto the new membership.
   - Brand-new email (the invite-fallback path) → only `default_department_id` survives, carried
     through as `user_invitations.department_id` (already flows to the membership at accept-time).
     `employee_code`/`job_title`/`start_date` have no column to live in pre-acceptance — set them
     via a profile update after the invite is accepted.
   - `default_department_id` is validated against the tenant's real `departments` rows.
3. **`DELETE /organizations/:orgId`** (new — GET/POST/PATCH already existed). Soft delete via
   `deleted_at` (the same column GET already filters on). Refuses to orphan anything: a unit with
   live children, the tenant root (`is_root`), or a unit still someone's `default_department_id`.
4. Regression tests: `tests/api/members-core-v1.test.mjs` (+3 checks for the new fields),
   `tests/api/organizations-core-v1.test.mjs` (new, 26 checks — tree, the PATCH cycle-detection
   that already existed but had no test, and all three DELETE refusal paths). All green.

**Not done, flagging rather than guessing:** no PATCH yet for editing `employee_code`/`job_title`/
`default_department_id`/`start_date` on an *existing* membership — right now they're set-once at
creation. No swagger doc for `organizations` at all (there wasn't one before either).

---

## Page by page

### P1 — Person & roster
`GET/POST /tenants/:id/members` is this page. Same tenant-scoped pagination/search/filter shape
your doc asks for. `employeeCode` convention (`EMP-`/`CON-`/`EXT-` prefix) — nothing enforces or
generates a prefix scheme server-side today; `employee_code` is a free string, so either the client
keeps generating it or Core adds a generation rule once Member Type (below) exists to key off of.
Real aggregate counts for tabs: doable today via the existing `count` on `GET /tenants/:id/members`
filtered by `role_type`/`status`; a dedicated `?type=`/`?workStatus=` filter isn't wired yet but
the columns exist to add it.

### P2 — Org units
`GET/POST/PATCH/DELETE /tenants/:id/organizations` + `/organizations/:orgId` — see above,
essentially built. Still missing: `employeeCount`/`teamsCount`/`positionsCount`/`fillRate` as
computed fields (need a view or RPC, not new columns), and `headName`/`headTitle` resolution from
the existing `manager_id` (a join, not new data). `fillRate`'s formula is still unknown to us too —
your §8 Q6 stays open; that's a product/business definition we don't have either.

### P3/P4/P5 — New Hires / Changes / Departures
Genuinely nothing exists — no Lifecycle-stage column, no checklist tables, no changes-workflow
table. Your recommendation to compute `progress` from checklist rows at read time (§8 Q3) — agreed,
we'll build it that way from the start rather than store a number that can drift. Your §8 Q4 (fixed
vs. per-unit/position onboarding steps) is a real design fork: fixed steps is a hardcoded list or
enum; variable steps is a template + checklist-item table. **We need your call on this before
designing the table**, since it changes the shape of every row in P3/P5.

### P6/P7 — Policy / Knowledge Base
Nothing exists. Agree they look like one schema wearing two labels (§8 Q5) — leaning toward one
`content_items` table with a type discriminator (`policy`/`article`) unless there's an approval-flow
or access-control reason to keep them separate that we're not aware of. Lowest priority either way,
per your own suggested order.

---

## §8 open questions — where we can answer now vs. still need you

| # | Question | Status |
|---|---|---|
| 1 | Member Type: closed enum or lookup table? | **Still open** — needs a new column regardless (nothing today models employee/contractor/partner/guest); closed enum matches your diagram and is simpler, recommend that unless you know of a broader partner/vendor taxonomy elsewhere in Thunder One |
| 2 | `unit`: string or FK? | **Answered** — already a FK (`default_department_id`), now exposed |
| 3 | `progress`: stored or computed? | **Agreed with your recommendation** — compute at read time |
| 4 | Fixed or variable onboarding/offboarding steps? | **Still open** — blocks table design for P3/P5, need your call |
| 5 | Policy/KB one schema or two? | **Leaning one, not final** — flag if there's a reason to split |
| 6 | `fillRate` formula? | **Still open** — we don't have this either, needs a product answer |
| 7 | Should Person/Membership be a new service? | **Answered — no.** It already is the canonical identity (`public.users`/`memberships`/`roles`), same one every other Core-backed app uses |

---

## Contract reference

`tests/api/members-core-v1.test.mjs`, `tests/api/organizations-core-v1.test.mjs`, and
`tests/api/invites-core-v1.test.mjs` (in this repo) are the executable spec for these endpoints'
exact request/response shapes — more reliable than reading route source if you just need "what does
this actually return."
