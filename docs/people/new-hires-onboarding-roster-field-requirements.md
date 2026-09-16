# New Hires Kanban: a roster-level onboarding list

> Written 2026-09-15 · For the Core/API team · Source: `people/new-hires`'s `NewHiresPage`
> (`/people/new-hires`) — the 4-stage Kanban board (**Pre-boarding → Onboarding → Ready to Work →
> Active**), still 100% mock roster data (`mock-data.ts`'s `newHireRows`) even though the per-person
> onboarding data it needs is now real.

## What already exists (confirmed by reading the code directly)

- `GET/PATCH /tenants/:id/members/:memberId/onboarding` — real, computes `progress: { done, total }`
  and `steps: [{ step_index, label, done, pending_label, completed_at }]` from a fixed 9-step
  template (`ONBOARDING_STEPS` in `src/lib/core/onboarding.ts`). The 9 step labels match this
  frontend's own `STEP_LABELS` (`new-hires/mock-data.ts`) exactly, word for word — no mismatch to
  reconcile.
- `GET /tenants/:id/members` — real, paginated (`page`/`limit`), one `?search=` filter, returns
  `id`/`user.full_name`/`employee_code`/`job_title`/`default_department_id`/`start_date`/`status`
  per row.

## The gap

Nothing lets a caller list *every* member's onboarding progress in one request — only one member
at a time. The Kanban board needs a roster (id, name, position, unit, start date, progress) to sort
into its 4 columns; calling the per-member endpoint once per row on every page load doesn't scale
(a 100-person tenant would mean 100 sequential/parallel Core requests just to render one page).

## Proposed: extend the existing members list, not a new resource

**`GET /tenants/:id/members?include=onboarding`** — same endpoint, pagination, and `?search=` as
today; the new query param additionally joins `membership_onboarding_steps` per row and adds an
`onboarding` field to each:

```json
{
  "id": "...", "user": { "full_name": "...", ... }, "employee_code": "...",
  "job_title": "...", "default_department_id": "...", "start_date": "...", "status": "active",
  "onboarding": { "done": 5, "total": 9 }
}
```

Reasoning for extending rather than a new `GET /onboarding` route: identical auth/pagination/search
already exist and work; the only new work is one conditional join, versus re-deriving auth +
pagination + search from scratch on a parallel endpoint. If a join-per-row is too expensive to do
unconditionally, gating it behind `include=onboarding` keeps the plain member list's existing
performance untouched for every other caller.

If a dedicated `GET /tenants/:id/onboarding` fits your architecture better instead, that's fine too
— the frontend only needs *a* list of `{ member fields } + { onboarding: { done, total } }`, not
this specific shape.

## Kanban column mapping — handled entirely on the frontend, no new Core concept needed

Core has no `pre-boarding`/`onboarding`/`ready-to-work`/`active` stage column (confirmed — the
original P3 ask for a `Lifecycle` column was never built; what got built instead is progress
computed from the checklist at read time, which is arguably better — see this doc's sibling
`requirements-people-workspace-api.md`'s own flag about not storing a derivable number
independently). The frontend derives the 4 columns from `onboarding.done`/`onboarding.total` and
the existing `status` field: 0 done → pre-boarding; some but not all → onboarding; all done but
`status: "invited"` (hasn't accepted yet) → ready-to-work; all done and `status: "active"` → active.
Not asking Core to model this — flagging it so the mapping logic's reasoning lives somewhere if the
4-stage split ever needs revisiting.

## Deliberately out of scope for this round

No filtering to "recent hires only" — a tenant with years of history would eventually have everyone
who ever completed onboarding sitting in the "active" column forever. Not blocking v1; the frontend
will render whatever the list returns. Worth a follow-up (a `since=` param, or capping to the most
recent N) if that turns out to matter in practice — not scoping it blind right now.

## Frontend side

Being built now against the contract above (`getOnboardingRoster()` in `people/new-hires/services/
onboarding-api.ts`, replacing `NewHiresPage`'s mock `newHireRows`) — same "build ahead of Core,
degrade gracefully" pattern already used for the edit-member-department-job-title work. This is a
plain server-side `GET` (not a mutation), so a 404 today just means the roster renders the same
"ไม่สามารถโหลดข้อมูลได้" empty state the rest of this app already uses when a Core fetch fails —
no special handling needed once Core ships this.
