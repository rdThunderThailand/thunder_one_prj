# Edit Personnel: update department/job_title on an existing member

> Written 2026-09-14 · For the Core/API team · Source: `people/personnel`'s `PersonnelTable`
> (`/people/personnel`) — the "..." row-action button, currently a disabled `title="Not built yet"`
> stub, and Core's `tenants/[id]/members/[memberId]/route.ts`, which today only exports `GET`/
> `DELETE`.

## Why this came up

Real onboarding testing (13 people, tenant "Thunder Enterprise") used the Bulk wizard to create
accounts with a placeholder department (`EIBIZ`, the root org) and placeholder job title
("รอกำหนดตำแหน่ง") — Bulk's own one-shared-value-per-batch shape can't assign 13 different
people's real, mostly-distinct departments/job titles in one run (see
`add-contractor-and-bulk-field-requirements.md`'s Part B). The plan was "bulk-create first, fix
each person's real department/job_title afterward via Personnel" — except that fix step doesn't
exist anywhere. Both `default_department_id` and `job_title` are real, already-used-at-create-time
columns on `memberships`; there's just no way to change them after creation.

## What's needed

A way to update an existing membership's `default_department_id` and `job_title`. Following the
convention already established by the sibling sub-resource routes on this same resource
(`.../contract` → `PUT`, `.../compensation` → `PUT`, `.../role` → `PATCH`), the natural fit is
extending the existing `tenants/[id]/members/[memberId]/route.ts` (which already has `GET`/`DELETE`
gated by `requireTenantAdmin` + `requireMembership`) with a `PATCH` handler:

**`PATCH /tenants/:id/members/:memberId`**

Request body (all optional — only send what changed, same "partial fields only overwrite what's
sent" behavior as the contract `PUT`):

```json
{
  "default_department_id": "uuid | null",
  "job_title": "string | null"
}
```

- `default_department_id`: must reference a real row in `departments` for this tenant (or `null` to
  clear it) — same validation `POST /tenants/:id/members` already does today for the same field.
- `job_title`: free text, same as the create endpoints (no format constraint there today).

Response: same shape as this route's existing `GET` (a `MemberView` row via `toMemberView()`) —
`{ success: true, data: {...} }` — so the frontend can just replace its local row from one response
without a second round-trip.

Auth: same as `GET`/`DELETE` on this exact route — `requireAppKey`, `requireTenantAdmin`,
`requireMembership`. No need for a stricter gate; department/job_title are already writable by a
tenant admin at create time via `/members`/`/employees`.

## Deliberately out of scope for this round

Scoped tight to unblock the immediate real-onboarding need. Not asking for, but flagging as an
obvious same-shaped follow-up if there's appetite later: `work_arrangement`, `notes`, `start_date`,
`member_type` — all real columns on `memberships` with the identical "settable at create, not
after" gap. A single `PATCH` accepting all of them (superset of the two above) would cost little
extra once this lands, but isn't blocking anything today.

## Frontend side

Being built now against the contract above (`updateMember()` in `people/personnel/services/
members-api.ts`, wired into a new edit modal on `PersonnelTable`'s row action) — same "build the
frontend against a proposed contract, 404 gracefully until Core ships it" pattern already used by
`asset-intelligence/assets`'s `EditAssetModal`. If the actual shape ends up different, the frontend
side is a small, contained diff to adjust.
