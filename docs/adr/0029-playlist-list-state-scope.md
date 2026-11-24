# 0029 — Playlist List State — Scope Decisions (Subtask 13)

## Context

Ticket [86d3xxpdd](https://app.clickup.com/t/3803720/86d3xxpdd) (Subtask 13 — Loading, Empty &
Error State) carries several acceptance criteria that require decisions before implementation.
Three were cut or deferred; this ADR records why.

### Decision 1 — Create-button permission gate is cut

AC: the Create Playlist button should only be shown to users with the relevant permission.

`Session` (`features/auth/services/get-session.ts`) carries no role or permission field.
Thunder_Core's `/session` endpoint does not return one. Thunder_Core enforces permission on every
mutating action (create, edit, delete, duplicate) at the API layer regardless of what the UI
shows. Wiring a client-side gate to data that does not exist would mean hard-coding a role name or
making a second API call solely to conditionally render a button that the backend would reject
anyway if misused.

**Decision:** The Create Playlist button is rendered unconditionally. Thunder_Core's server-side
enforcement is the only gate needed. If the session endpoint gains role/permission data in future,
adding a client-side gate is new work scoped to that change.

### Decision 2 — "เปลี่ยน Workspace" AC is N/A

AC: users without access should be shown a "Switch Workspace" option.

The app has no workspace or tenant switcher. Tenant is fixed per session — it is embedded in the
JWT and determined at login. There is no UI for switching tenants, and no API endpoint for it.

**Decision:** The "เปลี่ยน Workspace" AC is not applicable. `NoAccess` is shown for `forbidden`
errors, which already covers the case where a user reaches the page without permission. If a
workspace switcher is added in future, it is new work in that feature.

### Decision 3 — "Shared with Me" tab is deferred

AC: a third ownership tab showing playlists shared with the current user.

Sharing/ownership belongs to a separate subtask (ownership subtask) that is not yet designed.
The playlist list page's current data model (`PlaylistListItem`) carries no sharing metadata, and
`Thunder_Core` has no sharing endpoint wired to this feature.

**Decision:** The "Shared with Me" tab is out of scope for Subtask 13. It is explicitly deferred
to the ownership subtask. The tab bar currently shows "All Playlists" and "My Playlists" only.

## Consequences

No permission gate on the Create button. No workspace switcher. Two ownership tabs only.
All three decisions leave zero code changes as follow-up work unless the session endpoint,
sharing model, or workspace model changes — at which point each decision becomes new work
scoped to that change.
