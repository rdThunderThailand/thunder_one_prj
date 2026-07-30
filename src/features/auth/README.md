# auth

Authentication and session/user context for the dashboard.

`LoginForm` and `RegisterForm` (in `components/`) are built and routed at `/login` and `/register`. `services/auth.service.ts` calls placeholder API endpoints — there's no backend yet, so both will reject until it exists.

> R&D — UI implemented, not yet wired to a real backend or session management.

- `components/` — feature-scoped UI components
- `hooks/` — feature-scoped React hooks (e.g. data fetching, local state)
- `services/` — API calls for this feature (axios), isolated from components
- `types/` — TypeScript types/interfaces for this feature's domain
