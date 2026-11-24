# 0100 — Which Apps a tenant may open comes from Core

Status: proposed (2026-10-29, Nie: "superadmin import application name แล้ว thunder one query ว่า tenant
ได้สิทธิ workspace อะไรบ้าง"). Contract: Thunder_Core `docs/api/application-workspaces.md`. Migration:
Thunder_Core `supabase/migrations/20261029035937_application_workspaces.sql`.

## Context

`src/config/tenant-access.ts` hard-coded the rule from 2026-09-29: every tenant whose
`tenant_applications.role` is not `owner` sees only Media Workspace. Opening another App for one
customer meant a code change and a release. Media Workspace's own layout had no gate at all, because
every tenant was allowed in.

## Decision

1. **A platform super admin switches each App on or off per tenant, in core_prj_Frontend.** Core keeps
   the catalog (`application_workspaces`: one row per App, `code` = the App id in `config/apps.tsx`)
   and the switches (`tenant_application_workspaces`: no row = off).
2. **Thunder One reads the result from `/session` `enabled_workspaces`.** No extra round trip;
   `getSession()` already calls `/session` on every page.
3. **Owner tenant and platform super admin still see every App**, whatever the switches say. An
   unknown role still fails open (`getSession()`'s rule).
4. **`enabled_workspaces: null` keeps the old rule** (non-owner → Media Workspace only). Core sends
   null until Thunder One's catalog is imported, so the Core and Thunder One releases can ship in
   either order, and a failed lookup degrades to the old behaviour rather than to nothing.
5. **Media Workspace is gated like every other App.** A tenant sent away from an App lands on the first
   App it may open (launcher order), or `/profile` when it may open none — never a gated page, so no
   redirect loop.

## Consequences

- A new App needs its id imported into Core's catalog before any non-owner tenant can see it.
- The catalog `code` must equal the App id here; a typo shows the tenant nothing for that App.
- Still a courtesy layer: Core enforces tenant boundaries per request, not per App.
