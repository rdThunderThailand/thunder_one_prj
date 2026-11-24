# Asset Intelligence — requirement source

The product/role-based requirement spec for Asset Intelligence (6 personas, user stories, acceptance criteria, data model, sprint roadmap) lives outside this repo, in the Obsidian vault:

- `Eibiz/Thunder_One/Asset Intelligence/Asset Intelligence - Development Requirements (Role-Based).md` — source of truth for product requirements (confirmed 2026-08-18)
- `Eibiz/Thunder_One/Asset Intelligence/Asset Intelligence - Dev Process Mapping (Thunder One Repo).md` — maps that spec onto this repo's actual structure (v3, 2026-08-18); its §8 "Revised Sprint 1" is what `docs/adr/0022`–`0024` and the `asset-intelligence/assets`/`ai-mission-control` scaffolds implement

This file is a pointer, not a copy — do not duplicate the requirement content here. If a requirement changes, update the Obsidian doc and note the change in its own Decision Log (§8), not here.

## RBAC mapping note (2026-08-18)

Employee/User maps to `role_type = "operator"`, `code = "employee"` in `public.roles` — per the `role_type`-is-tier / `code`-is-persona-within-tier model decided in `docs/adr/0021-role-vocabulary-reconciliation.md` (tracked on the separate, not-yet-merged `docs/rbac-role-vocabulary-adr` branch). This is a mapping fact, not a new decision — recorded here since this branch doesn't have that ADR in its history yet. No code behavior changes: no permission gate exists, so nothing currently checks a logged-in user's `role_type`/`code` against which Asset Intelligence persona pages they can reach (see `src/config/nav/asset-intelligence.tsx`'s own comment on this). Relevant once real session-based RBAC wiring happens for this app.
