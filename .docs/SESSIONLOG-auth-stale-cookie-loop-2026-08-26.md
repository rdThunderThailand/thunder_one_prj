# Session Log: Stale authentication cookie redirect loop

**Date:** 2026-08-26  
**Risk:** R2

## Symptom

The Codex in-app browser could not open `/media-workspace/layouts` or `/login` on `localhost`. Both navigations ended with `ERR_TOO_MANY_REDIRECTS`, while a separate browser profile worked normally.

## Root cause

`src/proxy.ts` treated the presence of the `to_at` cookie as proof of a valid session and redirected every auth page to `/`. When Core rejected the stale token, `getSession()` redirected back to `/login`, creating a `/login` to `/` loop.

## Change

`/login` now remains reachable even when `to_at` exists, allowing the login request to replace an expired or revoked token. `/register` keeps the existing authenticated-cookie redirect behavior.

## Verification

- Pre-fix in-app browser reproduction: `http://localhost:3000/login` and `/media-workspace/layouts` both returned `ERR_TOO_MANY_REDIRECTS`.
- `pnpm exec eslint src/proxy.ts` passed.
- `pnpm exec tsc --noEmit` passed.
- `git diff --check` passed.
- Post-fix Codex in-app browser verification passed:
  - `/login` stayed at `http://localhost:3000/login` and rendered `Sign in to your workspace` with the existing browser session.
  - `/media-workspace/layouts` stayed at its target URL and rendered the `Layouts` heading and one layout row.
  - Console warning/error collection was empty during the check.
