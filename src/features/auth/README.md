# auth

Authentication and session/user context for the dashboard.

Routes (under `src/app/(auth)/`): `/login`, `/register`, `/set-password`, `/invites/accept`, `/no-access`.

- Login is real: `services/auth.service.ts`'s `login` posts to `/api/auth/login` (`src/app/api/auth/login/route.ts`); failures are classified by `login-error.ts`. Logout is `POST /api/auth/logout` (clears the session and tenant cookies).
- Invites are real: `setPassword` (via `/api/auth/set-password`), `acceptInvite` and `registerAndAcceptInvite` (via `/api/invites/*`) call route handlers that proxy to Core. `services/invites.service.ts` reads invite details and the current user's email from Core.
- `services/get-session.ts` builds the server-side `Session` (role, tenants, membership extras) from Core's `/session` and `/me/memberships`; `getAuthToken` reads the session token.
- Still a placeholder: `register` in `auth.service.ts` posts to `/auth/register` through `apiClient`, which has no backend, so `RegisterForm` will see it reject.

- `components/` — `LoginForm`, `RegisterForm`, `SetPasswordForm`, `AcceptInviteForm`, `AcceptInviteButton`, `SignOutButton`
- `hooks/` — feature-scoped React hooks (currently empty)
- `services/` — API calls and session resolution for this feature, isolated from components
- `types/` — TypeScript types/interfaces for this feature's domain
