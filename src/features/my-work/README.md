# my-work

Cross-App "what's waiting on me" rollup (`/my-work`), in three variants picked by `config/rbac.ts`'s `resolveShellVariant`: CEO/admin (`MyWorkPage`), manager (`ManagerMyWorkPage`) and employee (`EmployeeMyWorkPage`).

**Real data since 2026-09-25 — no mock data left.** Core has no task/assignment system, so the page is assembled from the Core records that actually ask something of the user:

| Kind | Source (`services/work-sources-api.ts`) | Links to |
|---|---|---|
| `approval` | `GET /partner-applications`, status `PENDING` (reviewers only; 403 → unavailable) | `/lead-approval` |
| `task` | `GET /tenants/:id/members?include=onboarding` — active members with unfinished onboarding (progress only; Core's step labels are still placeholders) | `/people/new-hires` |
| `waiting` | same roster read — members still in `invited` status | `/people/personnel` |
| `draft` | `GET /media/publications?status=draft` where `created_by` is this user; a draft's schedule start is its due date | `/media-workspace/publications/:id` |
| completed | partner applications this user reviewed (`actor_id`) | — |

- `work-items.ts` — `buildMyWork` normalizes the sources into one `MyWork` (`items`, `completed`, `available` per kind) plus the due-date helpers (`dueGroup`, `countByGroup`, `sortByUrgency`). `available[kind] === false` means the source failed or this user can't read it — tiles show "-" instead of 0. Scope `admin` (CEO + manager) includes tenant-wide follow-ups; `personal` (employee) only includes what's addressed to the user.
- Only drafts can carry a real due date; everything else lands in "No due date" — nothing invents a deadline, priority, assignee or project.
- Cards with no Core source render an `EmptyState`: calendar/schedule, recent documents, goals, announcements ("Important for You"). The "Inbox" tile shows "-". Quick Actions, Customize, Focus mode and the Ask ThunderOne bar are inert previews (not data).
- `components/work-item-meta.tsx` — per-kind icon/tone/label and per-due-group label/color shared by all variants.
- Loading: the route awaits the session and the Core reads; `app/(dashboard)/(shell)/my-work/loading.tsx` shows `MyWorkSkeleton` meanwhile.
